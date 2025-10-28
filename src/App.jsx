import Dictaphone from "./Dictaphone";
import { useSearchParams } from "react-router-dom";
import { useDisplaySession } from "./hooks/useDisplaySession";
import { useEffect } from "react";

function App() {
  const [searchParams] = useSearchParams();
  const uniqueId = searchParams.get("displayId") || "";

  const { startSession, endSession, isConnected } = useDisplaySession(uniqueId);

  useEffect(() => {
    if (uniqueId) {
      startSession();
    }

    return () => {
      endSession();
    };
  }, [uniqueId]);

  return (
    <div>
      {isConnected ? (
        <Dictaphone displayId={uniqueId} />
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          연결중...
        </div>
      )}
    </div>
  );
}

export default App;
