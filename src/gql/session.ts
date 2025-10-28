import { gql } from "graphql-tag";

export const ACQUIRE_SESSION_LOCK = gql`
  mutation AcquireSessionLock($displayId: String!) {
    acquireSessionLock(displayId: $displayId) {
      sessionId
      success
    }
  }
`;

export const SEND_PING_RESPONSE = gql`
  mutation SendPingResponse($sessionId: String!) {
    sendPingResponse(sessionId: $sessionId)
  }
`;

export const RELEASE_SESSION_LOCK = gql`
  mutation ReleaseSessionLock($sessionId: String!) {
    releaseSessionLock(sessionId: $sessionId)
  }
`;

export const SESSION_PING_SUBSCRIPTION = gql`
  subscription SessionPing($displayId: String!) {
    sessionPing(displayId: $displayId) {
      type
      displayId
      data {
        sessionId
        timestamp
        sequence
      }
    }
  }
`;

export const SESSION_EXPIRED_SUBSCRIPTION = gql`
  subscription SessionExpired($displayId: String!) {
    sessionExpired(displayId: $displayId) {
      type
      displayId
      data {
        sessionId
        timestamp
        reason
      }
    }
  }
`;
