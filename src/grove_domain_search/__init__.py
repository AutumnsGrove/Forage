"""
grove-domain-search: AI-powered asynchronous domain availability checker.

Reduces domain hunting from weeks to hours using AI agents and RDAP checking.
"""

__version__ = "0.1.0"
__author__ = "Autumn Brown"
__email__ = "autumn@grove.place"

from .checker import check_domain, check_domains, DomainResult
from .pricing import get_domain_pricing, get_batch_pricing, DomainPrice, categorize_domains_by_pricing
from .config import config

__all__ = [
    "check_domain", 
    "check_domains", 
    "DomainResult",
    "get_domain_pricing",
    "get_batch_pricing", 
    "DomainPrice",
    "categorize_domains_by_pricing",
    "config"
]