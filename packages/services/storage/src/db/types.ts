/* tslint:disable */

/**
 * AUTO-GENERATED FILE - DO NOT EDIT!
 *
 * This file was automatically generated by schemats v.7.0.0
 * $ schemats generate -c postgres://username:password@localhost:5432/registry?sslmode=disable -t activities -t alert_channels -t alerts -t commits -t migration -t organization_invitations -t organization_member -t organizations -t organizations_billing -t persisted_operations -t projects -t supertokens_all_auth_recipe_users -t supertokens_emailpassword_pswd_reset_tokens -t supertokens_emailpassword_users -t supertokens_emailverification_tokens -t supertokens_emailverification_verified_emails -t supertokens_jwt_signing_keys -t supertokens_key_value -t supertokens_passwordless_codes -t supertokens_passwordless_devices -t supertokens_passwordless_users -t supertokens_role_permissions -t supertokens_roles -t supertokens_session_access_token_signing_keys -t supertokens_session_info -t supertokens_thirdparty_users -t supertokens_user_metadata -t supertokens_user_roles -t supertokens_userid_mapping -t target_validation -t targets -t tokens -t users -t version_commit -t versions -s public
 *
 */

export type alert_channel_type = "SLACK" | "WEBHOOK";
export type alert_type = "SCHEMA_CHANGE_NOTIFICATIONS";
export type operation_kind = "mutation" | "query" | "subscription";
export type organization_type = "PERSONAL" | "REGULAR";
export type user_role = "ADMIN" | "MEMBER";

export interface activities {
  activity_metadata: any;
  activity_type: string;
  created_at: Date;
  id: string;
  organization_id: string;
  project_id: string | null;
  target_id: string | null;
  user_id: string;
}

export interface alert_channels {
  created_at: Date;
  id: string;
  name: string;
  project_id: string;
  slack_channel: string | null;
  type: alert_channel_type;
  webhook_endpoint: string | null;
}

export interface alerts {
  alert_channel_id: string;
  created_at: Date;
  id: string;
  project_id: string;
  target_id: string;
  type: alert_type;
}

export interface commits {
  author: string;
  commit: string;
  content: string;
  created_at: Date;
  id: string;
  metadata: string | null;
  project_id: string;
  service: string | null;
  target_id: string;
}

export interface migration {
  date: Date;
  hash: string;
  name: string;
}

export interface organization_invitations {
  code: string;
  created_at: Date;
  email: string;
  expires_at: Date;
  organization_id: string;
}

export interface organization_member {
  organization_id: string;
  role: user_role;
  scopes: Array<string> | null;
  user_id: string;
}

export interface organizations {
  clean_id: string;
  created_at: Date;
  get_started_checking_schema: boolean;
  get_started_creating_project: boolean;
  get_started_inviting_members: boolean;
  get_started_publishing_schema: boolean;
  get_started_reporting_operations: boolean;
  get_started_usage_breaking: boolean;
  github_app_installation_id: string | null;
  id: string;
  limit_operations_monthly: string;
  limit_retention_days: string;
  name: string;
  plan_name: string;
  slack_token: string | null;
  type: organization_type;
  user_id: string;
}

export interface organizations_billing {
  billing_email_address: string | null;
  external_billing_reference_id: string;
  organization_id: string;
}

export interface persisted_operations {
  content: string;
  created_at: Date;
  id: string;
  operation_hash: string;
  operation_kind: operation_kind;
  operation_name: string;
  project_id: string;
}

export interface projects {
  build_url: string | null;
  clean_id: string;
  created_at: Date;
  git_repository: string | null;
  id: string;
  name: string;
  org_id: string;
  type: string;
  validation_url: string | null;
}

export interface supertokens_all_auth_recipe_users {
  recipe_id: string;
  time_joined: string;
  user_id: string;
}

export interface supertokens_emailpassword_pswd_reset_tokens {
  token: string;
  token_expiry: string;
  user_id: string;
}

export interface supertokens_emailpassword_users {
  email: string;
  password_hash: string;
  time_joined: string;
  user_id: string;
}

export interface supertokens_emailverification_tokens {
  email: string;
  token: string;
  token_expiry: string;
  user_id: string;
}

export interface supertokens_emailverification_verified_emails {
  email: string;
  user_id: string;
}

export interface supertokens_jwt_signing_keys {
  algorithm: string;
  created_at: string | null;
  key_id: string;
  key_string: string;
}

export interface supertokens_key_value {
  created_at_time: string | null;
  name: string;
  value: string | null;
}

export interface supertokens_passwordless_codes {
  code_id: string;
  created_at: string;
  device_id_hash: string;
  link_code_hash: string;
}

export interface supertokens_passwordless_devices {
  device_id_hash: string;
  email: string | null;
  failed_attempts: number;
  link_code_salt: string;
  phone_number: string | null;
}

export interface supertokens_passwordless_users {
  email: string | null;
  phone_number: string | null;
  time_joined: string;
  user_id: string;
}

export interface supertokens_role_permissions {
  permission: string;
  role: string;
}

export interface supertokens_roles {
  role: string;
}

export interface supertokens_session_access_token_signing_keys {
  created_at_time: string;
  value: string | null;
}

export interface supertokens_session_info {
  created_at_time: string;
  expires_at: string;
  jwt_user_payload: string | null;
  refresh_token_hash_2: string;
  session_data: string | null;
  session_handle: string;
  user_id: string;
}

export interface supertokens_thirdparty_users {
  email: string;
  third_party_id: string;
  third_party_user_id: string;
  time_joined: string;
  user_id: string;
}

export interface supertokens_user_metadata {
  user_id: string;
  user_metadata: string;
}

export interface supertokens_user_roles {
  role: string;
  user_id: string;
}

export interface supertokens_userid_mapping {
  external_user_id: string;
  external_user_id_info: string | null;
  supertokens_user_id: string;
}

export interface target_validation {
  destination_target_id: string;
  target_id: string;
}

export interface targets {
  base_schema: string | null;
  clean_id: string;
  created_at: Date;
  id: string;
  name: string;
  project_id: string;
  validation_enabled: boolean;
  validation_excluded_clients: Array<string> | null;
  validation_percentage: number;
  validation_period: number;
}

export interface tokens {
  created_at: Date;
  deleted_at: Date | null;
  id: string;
  last_used_at: Date | null;
  name: string;
  organization_id: string;
  project_id: string;
  scopes: Array<string> | null;
  target_id: string;
  token: string;
  token_alias: string;
}

export interface users {
  created_at: Date;
  display_name: string;
  email: string;
  external_auth_user_id: string | null;
  full_name: string;
  id: string;
  is_admin: boolean | null;
  supertoken_user_id: string | null;
}

export interface version_commit {
  commit_id: string;
  url: string | null;
  version_id: string;
}

export interface versions {
  base_schema: string | null;
  commit_id: string;
  created_at: Date;
  id: string;
  target_id: string;
  valid: boolean;
}
