import { useEffect, useRef } from "react";

export const usePageLock = (pageId = "main") => {
  const eventSourceRef = useRef(null);
  const sessionIdRef = useRef(crypto.randomUUID());

  useEffect(() => {
    const sessionId = sessionIdRef.current;

    eventSourceRef.current = new EventSource(
      `http://localhost:8000/stream?page_id=${pageId}&session_id=${sessionId}`
    );

    eventSourceRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "pageLocked") {
        console.log("페이지 락 성공:", pageId);
      }
    };

    eventSourceRef.current.onerror = () => {
      console.log("페이지 락 실패 - 이미 사용 중");
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [pageId]);

  return sessionIdRef.current;
};
