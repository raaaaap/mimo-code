export interface SdkRequest {
  type: 'query' | 'cancel' | 'permission_response';
  payload: unknown;
}

export interface SdkResponse {
  type: 'text' | 'tool_use' | 'permission_request' | 'done' | 'error';
  payload: unknown;
}
