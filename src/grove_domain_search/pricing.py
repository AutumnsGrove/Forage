"""
Domain pricing lookup using Cloudflare's API

Provides pricing information for available domains and categorizes them
based on configured thresholds (bundled, recommended, premium).
"""

import httpx
from dataclasses import dataclass
from typing import Optional, Dict, List
from urllib.parse import quote

from .config import config


@dataclass
class DomainPrice:
    """Pricing information for a domain."""
    domain: str
    tld: str
    price_cents: int
    currency: str = "USD"
    is_premium: bool = False
    is_bundled: bool = False
    is_recommended: bool = False
    annual_renewal_cents: Optional[int] = None
    
    def __post_init__(self):
        """Categorize based on pricing thresholds."""
        self.is_bundled = self.price_cents <= config.pricing.bundled_max_cents
        self.is_recommended = self.price_cents <= config.pricing.recommended_max_cents
        self.is_premium = self.price_cents >= config.pricing.premium_flag_above_cents
    
    @property
    def price_dollars(self) -> float:
        """Price in dollars for display."""
        return self.price_cents / 100.0
    
    @property
    def category(self) -> str:
        """Get pricing category."""
        if self.is_bundled:
            return "bundled"
        elif self.is_recommended:
            return "recommended"
        elif self.is_premium:
            return "premium"
        else:
            return "standard"
    
    def __str__(self) -> str:
        """Human-readable pricing info."""
        category_symbol = {
            "bundled": "📦",
            "recommended": "✅", 
            "premium": "💎",
            "standard": "🔹"
        }.get(self.category, "🔹")
        
        return f"{category_symbol} {self.domain}: ${self.price_dollars:.2f} ({self.category})"


class PricingError(Exception):
    """Pricing lookup failed."""
    pass


class CloudflarePricing:
    """Cloudflare domain pricing API client."""
    
    # Cloudflare's pricing API endpoint (public, no auth required)
    PRICING_API_URL = "https://api.cloudflare.com/client/v4/domains/pricing"
    
    def __init__(self, timeout: float = 10.0):
        """Initialize pricing client."""
        self.timeout = timeout
        self._price_cache: Dict[str, DomainPrice] = {}
    
    async def get_tld_pricing(self, tld: str) -> Optional[DomainPrice]:
        """
        Get pricing information for a specific TLD.
        
        Args:
            tld: Top-level domain (e.g., "com", "io", "dev")
            
        Returns:
            DomainPrice object or None if pricing unavailable
        """
        if tld in self._price_cache:
            return self._price_cache[tld]
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Cloudflare's API returns pricing for all TLDs, we'll filter
                response = await client.get(self.PRICING_API_URL)
                response.raise_for_status()
                
                data = response.json()
                if not data.get("success"):
                    raise PricingError(f"API error: {data.get('errors', 'Unknown error')}")
                
                # Find pricing for this TLD
                for pricing_info in data.get("result", []):
                    if pricing_info.get("tld") == tld:
                        price_cents = int(pricing_info.get("price", 0) * 100)  # Convert to cents
                        renewal_cents = int(pricing_info.get("renewal_price", price_cents) * 100)
                        
                        domain_price = DomainPrice(
                            domain=f".{tld}",
                            tld=tld,
                            price_cents=price_cents,
                            annual_renewal_cents=renewal_cents
                        )
                        
                        self._price_cache[tld] = domain_price
                        return domain_price
                
                # TLD not found in pricing data
                return None
                
        except httpx.HTTPError as e:
            raise PricingError(f"HTTP error fetching pricing: {e}")
        except Exception as e:
            raise PricingError(f"Error fetching pricing: {e}")
    
    async def get_domain_pricing(self, domain: str) -> Optional[DomainPrice]:
        """
        Get pricing for a full domain name.
        
        Args:
            domain: Full domain name (e.g., "example.com")
            
        Returns:
            DomainPrice object or None if pricing unavailable
        """
        # Extract TLD
        tld = domain.lower().split(".")[-1]
        pricing = await self.get_tld_pricing(tld)
        
        if pricing:
            # Create a copy with the full domain name
            return DomainPrice(
                domain=domain,
                tld=pricing.tld,
                price_cents=pricing.price_cents,
                currency=pricing.currency,
                annual_renewal_cents=pricing.annual_renewal_cents
            )
        
        return None
    
    async def batch_pricing(self, domains: List[str]) -> Dict[str, DomainPrice]:
        """
        Get pricing for multiple domains efficiently.
        
        Args:
            domains: List of domain names
            
        Returns:
            Dict mapping domain -> DomainPrice (only for domains with pricing available)
        """
        # Extract unique TLDs
        tlds = {domain.lower().split(".")[-1] for domain in domains}
        
        # Fetch pricing for each TLD
        pricing_results = {}
        for tld in tlds:
            try:
                tld_pricing = await self.get_tld_pricing(tld)
                if tld_pricing:
                    pricing_results[tld] = tld_pricing
            except PricingError:
                # Skip TLDs with pricing errors
                continue
        
        # Map back to full domains
        domain_pricing = {}
        for domain in domains:
            tld = domain.lower().split(".")[-1]
            if tld in pricing_results:
                tld_pricing = pricing_results[tld]
                domain_pricing[domain] = DomainPrice(
                    domain=domain,
                    tld=tld_pricing.tld,
                    price_cents=tld_pricing.price_cents,
                    currency=tld_pricing.currency,
                    annual_renewal_cents=tld_pricing.annual_renewal_cents
                )
        
        return domain_pricing


# Singleton instance
pricing_client = CloudflarePricing()


async def get_domain_pricing(domain: str) -> Optional[DomainPrice]:
    """
    Convenience function to get pricing for a single domain.
    
    Args:
        domain: Domain name to check
        
    Returns:
        DomainPrice object or None if pricing unavailable
    """
    return await pricing_client.get_domain_pricing(domain)


async def get_batch_pricing(domains: List[str]) -> Dict[str, DomainPrice]:
    """
    Convenience function to get pricing for multiple domains.
    
    Args:
        domains: List of domain names
        
    Returns:
        Dict mapping domain -> DomainPrice
    """
    return await pricing_client.batch_pricing(domains)


def categorize_domains_by_pricing(domain_prices: Dict[str, DomainPrice]) -> Dict[str, List[str]]:
    """
    Categorize domains by pricing tiers.
    
    Args:
        domain_prices: Dict of domain -> DomainPrice
        
    Returns:
        Dict with categories as keys and lists of domains as values
    """
    categories = {
        "bundled": [],
        "recommended": [],
        "standard": [],
        "premium": []
    }
    
    for domain, price_info in domain_prices.items():
        categories[price_info.category].append(domain)
    
    return categories