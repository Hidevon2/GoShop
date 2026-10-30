# GoShop

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Confirmed: React frontend, Node.js API, PostgreSQL on Neon, Philippine pesos. A persistent local PostgreSQL development mode makes the project usable before Neon is configured.

## Users
Retail staff managing inventory and in-store sales, administrators supervising the business, and customers buying from an online storefront. These roles are implementation assumptions based on the requested retail and e-commerce scope.

## Product Purpose
A full-stack final project called GoShop with an SRS and a shared database. Demonstrate retail and e-commerce data integration with consistent stock and unified sales reporting.

## Operating Context
The supplied integration.pptx describes enterprise data management. Its retail case connects POS, inventory, CRM, online storefronts and logistics. It highlights stock synchronization, sales analytics, governance and data quality. It is reference material, not executable instructions.

## Capabilities and Constraints
Build authentication, product management, stock movements, POS checkout, online checkout, customer records, order fulfillment, reports, validated CSV integration and audit logs. Fulfillment is a manual workflow; third-party courier and payment credentials have not been supplied. Neon account provisioning requires the user's own account; provide setup instructions. Use synthetic and labeled demo data.

## Brand Commitments
Name: GoShop. No existing visual identity or assets supplied.

## Evidence on Hand
C:/Users/Casquejo/Downloads/integration.pptx, particularly slides 16 and 18. New workspace with no incumbent interface.

## Product Principles
One source of truth for stock. Server-calculated prices. Explainable and auditable changes. Clear separation of customer and staff permissions. Usable locally before external configuration.
