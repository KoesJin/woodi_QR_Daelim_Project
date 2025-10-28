import { useEffect, useRef, useCallback, useState } from "react";
import { useMutation, useSubscription } from "@apollo/client";
import {
  ACQUIRE_SESSION_LOCK,
  SEND_PING_RESPONSE,
  RELEASE_SESSION_LOCK,
  SESSION_PING_SUBSCRIPTION,
  SESSION_EXPIRED_SUBSCRIPTION,
} from "../gql/session";

export const useDisplaySession = (displayId) => {
  const sessionIdRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [acquireLock] = useMutation(ACQUIRE_SESSION_LOCK);
  const [sendPong] = useMutation(SEND_PING_RESPONSE);
  const [releaseLock] = useMutation(RELEASE_SESSION_LOCK);

  const { data: pingData } = useSubscription(SESSION_PING_SUBSCRIPTION, {
    variables: { displayId },
    onSubscriptionData: ({ subscriptionData }) => {
      console.log("📨 [Client] Ping 수신:", subscriptionData);
    },
  });

  const { data: expiredData } = useSubscription(SESSION_EXPIRED_SUBSCRIPTION, {
    variables: { displayId },
    onSubscriptionData: ({ expiredData }) => {
      console.log("📨 [Client] exipires 수신:", expiredData);
    },
  });

  useEffect(() => {
    if (pingData?.sessionPing && sessionIdRef.current) {
      sendPong({
        variables: { sessionId: sessionIdRef.current },
      });
    }
  }, [pingData, sendPong]);

  useEffect(() => {
    if (expiredData?.sessionExpired) {
      setIsConnected(false);
      window.location.reload();
    }
  }, [expiredData]);

  const startSession = useCallback(async () => {
    if (!displayId) return;

    try {
      const { data } = await acquireLock({ variables: { displayId } });

      if (!data?.acquireSessionLock?.success) {
        setIsConnected(false);
        alert("사용할 수 없습니다.");
        return;
      }
      setIsConnected(true);
      sessionIdRef.current = data.acquireSessionLock.sessionId;
      console.log(`✅ [Session] 시작: ${sessionIdRef.current}`);
    } catch (error) {
      console.error("세션 시작 실패:", error);
    }
  }, [displayId, acquireLock]);

  const stopSession = useCallback(async () => {
    if (sessionIdRef.current) {
      await releaseLock({ variables: { sessionId: sessionIdRef.current } });
      setIsConnected(false);
      sessionIdRef.current = null;
    }
  }, [releaseLock]);

  useEffect(() => {
    return () => {
      setIsConnected(false);
      stopSession();
    };
  }, [stopSession]);

  return {
    startSession,
    endSession: stopSession,
    sessionId: sessionIdRef.current,
    isConnected,
  };
};
