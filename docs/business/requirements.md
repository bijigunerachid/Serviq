
# Serviq — Product Requirements

## Product
Multi-tenant field service management platform.

## Initial market
HVAC maintenance companies in Morocco.

## Platforms
- Web: Owners, managers, dispatchers
- Mobile: Technicians

## Supported languages
- French (default)
- Arabic (RTL)

## MVP Modules
- Authentication
- Tenant and membership management
- Customer management
- Equipment management
- Work orders
- Technician assignments
- Intervention reports
- Basic operational dashboard
- Audit and work order history

## Initial Work Order Statuses
- NEW
- SCHEDULED
- IN_PROGRESS
- ON_HOLD
- COMPLETED
- CLOSED
- CANCELLED

## Key Business Rules
- Every company owns its business data.
- Users access companies through memberships.
- Technicians can only access assigned work.
- Closing a work order requires report approval.
- Status changes must be recorded.
- Cross-tenant access is forbidden.
- French and Arabic must be supported.

## Out of Scope for First Release
- AI diagnostics
- GPS live tracking
- Advanced inventory
- Automated route optimization
- IoT integrations
- Advanced billing
