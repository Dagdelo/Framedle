#!/usr/bin/env bash
# =============================================================================
# Logto Configuration Automation Script
# =============================================================================
#
# Automates reproducible Logto configuration via the Management API.
#
# Usage:
#   LOGTO_ENDPOINT=https://auth.framedle.wtf \
#   M2M_APP_ID=xxx M2M_APP_SECRET=yyy \
#   ./scripts/setup-logto.sh \
#     --api-resource https://api.framedle.wtf \
#     --webhook-url https://api.framedle.wtf/webhooks/logto
#
# Required environment variables:
#   LOGTO_ENDPOINT    - Base URL of your Logto instance (no trailing slash)
#   M2M_APP_ID        - Machine-to-Machine application client ID
#   M2M_APP_SECRET    - Machine-to-Machine application client secret
#
# Required arguments:
#   --api-resource    - API resource identifier (e.g., https://api.framedle.wtf)
#   --webhook-url     - Webhook endpoint URL (e.g., https://api.framedle.wtf/webhooks/logto)
#
# Optional arguments:
#   --api-name        - Display name for the API resource (default: "Framedle API")
#   --role-name       - Admin role name (default: "admin")
#   --webhook-name    - Webhook name (default: "Framedle User Sync")
#   --help            - Show this help message
#
# What this script DOES automate:
#   - API resource registration (identifier + token TTL)
#   - Admin role creation (user-type role)
#   - Webhook registration (User.Created, User.Data.Updated, User.Deleted)
#
# What this script CANNOT automate (requires admin console UI):
#   - Social connectors (Google, GitHub, Twitter, Facebook) — provider OAuth
#     app credentials must be entered in the Logto admin console
#   - Sign-in experience branding (logo, colors, sign-in methods order)
#   - Traditional Web Application creation — the Logto Management API does
#     support POST /api/applications, but redirect URIs and post-logout URIs
#     must be verified manually; use the admin console for initial setup
#   - Admin user role assignment — must be done manually in Users section
#   - M2M application creation — chicken-and-egg: you need M2M credentials
#     to call the API, so these must be created in the admin console first
#
# Dependencies: curl, jq
# =============================================================================

set -euo pipefail

# ---- Colors -----------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ---- Helpers ----------------------------------------------------------------
log_info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[OK]${NC}   $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

die() {
  log_error "$*"
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

# ---- Argument parsing -------------------------------------------------------
API_RESOURCE=""
WEBHOOK_URL=""
API_NAME="Framedle API"
ROLE_NAME="admin"
WEBHOOK_NAME="Framedle User Sync"

usage() {
  sed -n '/^# Usage:/,/^# Dependencies:/p' "$0" | sed 's/^# \?//'
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --api-resource)  API_RESOURCE="$2";  shift 2 ;;
    --webhook-url)   WEBHOOK_URL="$2";   shift 2 ;;
    --api-name)      API_NAME="$2";      shift 2 ;;
    --role-name)     ROLE_NAME="$2";     shift 2 ;;
    --webhook-name)  WEBHOOK_NAME="$2";  shift 2 ;;
    --help|-h)       usage ;;
    *) die "Unknown argument: $1. Run with --help for usage." ;;
  esac
done

# ---- Validation -------------------------------------------------------------
require_cmd curl
require_cmd jq

[[ -z "${LOGTO_ENDPOINT:-}" ]]  && die "LOGTO_ENDPOINT environment variable is required"
[[ -z "${M2M_APP_ID:-}" ]]      && die "M2M_APP_ID environment variable is required"
[[ -z "${M2M_APP_SECRET:-}" ]]  && die "M2M_APP_SECRET environment variable is required"
[[ -z "$API_RESOURCE" ]]        && die "--api-resource argument is required"
[[ -z "$WEBHOOK_URL" ]]         && die "--webhook-url argument is required"

# Strip trailing slash from endpoint
LOGTO_ENDPOINT="${LOGTO_ENDPOINT%/}"

log_info "Logto endpoint: $LOGTO_ENDPOINT"
log_info "API resource:   $API_RESOURCE"
log_info "Webhook URL:    $WEBHOOK_URL"
echo

# ---- Step 1: Obtain M2M access token ---------------------------------------
log_info "Step 1: Obtaining M2M access token..."

TOKEN_RESPONSE=$(curl -sf \
  --fail-with-body \
  -X POST "${LOGTO_ENDPOINT}/oidc/token" \
  -u "${M2M_APP_ID}:${M2M_APP_SECRET}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&resource=https://default.logto.app/api&scope=all" \
  2>&1) || die "Failed to obtain M2M token. Check LOGTO_ENDPOINT, M2M_APP_ID, M2M_APP_SECRET.\nResponse: $TOKEN_RESPONSE"

TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token // empty')
[[ -z "$TOKEN" ]] && die "No access_token in response: $TOKEN_RESPONSE"

log_success "M2M token obtained (expires in $(echo "$TOKEN_RESPONSE" | jq -r '.expires_in')s)"
echo

# ---- Shared API call helper -------------------------------------------------
logto_api() {
  local method="$1"
  local path="$2"
  local body="${3:-}"

  local args=(-sf --fail-with-body
    -X "$method"
    "${LOGTO_ENDPOINT}/api${path}"
    -H "Authorization: Bearer $TOKEN"
    -H "Content-Type: application/json"
  )
  [[ -n "$body" ]] && args+=(-d "$body")

  curl "${args[@]}" 2>&1
}

# ---- Step 2: Create API Resource --------------------------------------------
log_info "Step 2: Creating API resource '${API_NAME}' (${API_RESOURCE})..."

# Check if resource already exists
EXISTING_RESOURCES=$(logto_api GET "/resources?page=1&page_size=50") \
  || die "Failed to list API resources: $EXISTING_RESOURCES"

EXISTING_ID=$(echo "$EXISTING_RESOURCES" | jq -r \
  --arg indicator "$API_RESOURCE" \
  '.[] | select(.indicator == $indicator) | .id // empty')

if [[ -n "$EXISTING_ID" ]]; then
  log_warn "API resource '${API_RESOURCE}' already exists (id: ${EXISTING_ID}). Skipping creation."
  RESOURCE_ID="$EXISTING_ID"
else
  RESOURCE_RESPONSE=$(logto_api POST "/resources" "$(jq -n \
    --arg name "$API_NAME" \
    --arg indicator "$API_RESOURCE" \
    '{name: $name, indicator: $indicator, tokenTtl: 3600}')" \
  ) || die "Failed to create API resource: $RESOURCE_RESPONSE"

  RESOURCE_ID=$(echo "$RESOURCE_RESPONSE" | jq -r '.id // empty')
  [[ -z "$RESOURCE_ID" ]] && die "No id in API resource response: $RESOURCE_RESPONSE"
  log_success "API resource created (id: ${RESOURCE_ID})"
fi
echo

# ---- Step 3: Create admin role ----------------------------------------------
log_info "Step 3: Creating role '${ROLE_NAME}'..."

# Check if role already exists
EXISTING_ROLES=$(logto_api GET "/roles?page=1&page_size=50") \
  || die "Failed to list roles: $EXISTING_ROLES"

EXISTING_ROLE_ID=$(echo "$EXISTING_ROLES" | jq -r \
  --arg name "$ROLE_NAME" \
  '.[] | select(.name == $name) | .id // empty')

if [[ -n "$EXISTING_ROLE_ID" ]]; then
  log_warn "Role '${ROLE_NAME}' already exists (id: ${EXISTING_ROLE_ID}). Skipping creation."
  ROLE_ID="$EXISTING_ROLE_ID"
else
  ROLE_RESPONSE=$(logto_api POST "/roles" "$(jq -n \
    --arg name "$ROLE_NAME" \
    '{name: $name, description: "Full admin access to Framedle dashboard", type: "User"}')" \
  ) || die "Failed to create role: $ROLE_RESPONSE"

  ROLE_ID=$(echo "$ROLE_RESPONSE" | jq -r '.id // empty')
  [[ -z "$ROLE_ID" ]] && die "No id in role response: $ROLE_RESPONSE"
  log_success "Role '${ROLE_NAME}' created (id: ${ROLE_ID})"
fi
echo

# ---- Step 4: Register webhook -----------------------------------------------
log_info "Step 4: Registering webhook '${WEBHOOK_NAME}' → ${WEBHOOK_URL}..."

# Check if webhook already exists for this URL
EXISTING_HOOKS=$(logto_api GET "/hooks?page=1&page_size=50") \
  || die "Failed to list webhooks: $EXISTING_HOOKS"

EXISTING_HOOK_ID=$(echo "$EXISTING_HOOKS" | jq -r \
  --arg url "$WEBHOOK_URL" \
  '.[] | select(.config.url == $url) | .id // empty' | head -1)

if [[ -n "$EXISTING_HOOK_ID" ]]; then
  log_warn "Webhook for '${WEBHOOK_URL}' already exists (id: ${EXISTING_HOOK_ID}). Skipping creation."
  HOOK_ID="$EXISTING_HOOK_ID"
  SIGNING_KEY=$(echo "$EXISTING_HOOKS" | jq -r \
    --arg url "$WEBHOOK_URL" \
    '.[] | select(.config.url == $url) | .signingKey // empty' | head -1)
else
  HOOK_RESPONSE=$(logto_api POST "/hooks" "$(jq -n \
    --arg name "$WEBHOOK_NAME" \
    --arg url "$WEBHOOK_URL" \
    '{
      name: $name,
      events: ["User.Created", "User.Data.Updated", "User.Deleted"],
      config: {url: $url},
      enabled: true
    }')" \
  ) || die "Failed to create webhook: $HOOK_RESPONSE"

  HOOK_ID=$(echo "$HOOK_RESPONSE" | jq -r '.id // empty')
  SIGNING_KEY=$(echo "$HOOK_RESPONSE" | jq -r '.signingKey // empty')
  [[ -z "$HOOK_ID" ]] && die "No id in webhook response: $HOOK_RESPONSE"
  log_success "Webhook registered (id: ${HOOK_ID})"
fi
echo

# ---- Output summary ---------------------------------------------------------
echo "======================================================================"
echo " SETUP COMPLETE"
echo "======================================================================"
echo
echo "Resource IDs:"
echo "  API Resource id:  ${RESOURCE_ID}"
echo "  Admin Role id:    ${ROLE_ID}"
echo "  Webhook id:       ${HOOK_ID}"
echo
echo "Environment variables to set:"
echo
echo "  # Logto instance"
echo "  LOGTO_ENDPOINT=${LOGTO_ENDPOINT}"
echo "  LOGTO_API_RESOURCE=${API_RESOURCE}"
echo "  LOGTO_MANAGEMENT_API_RESOURCE=https://default.logto.app/api"
if [[ -n "$SIGNING_KEY" ]]; then
echo
echo "  # Webhook signing key (LOGTO_WEBHOOK_SECRET)"
echo "  LOGTO_WEBHOOK_SECRET=${SIGNING_KEY}"
fi
echo
echo "Manual steps still required (admin console):"
echo "  1. Create Traditional Web Application → copy NUXT_LOGTO_APP_ID + NUXT_LOGTO_APP_SECRET"
echo "  2. Create/verify M2M Application → copy LOGTO_M2M_APP_ID + LOGTO_M2M_APP_SECRET"
echo "  3. Configure social connectors: Google, GitHub, Twitter, Facebook"
echo "  4. Configure sign-in experience (branding, sign-in methods)"
echo "  5. Assign '${ROLE_NAME}' role to admin user in Users section"
echo "  6. Register callback URIs with each OAuth provider:"
echo "     ${LOGTO_ENDPOINT}/callback/<connector-id>"
echo "======================================================================"
