import { useSearch } from "wouter";
import { BrowserInterface } from "@/components/BrowserInterface";

export default function Browser() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const initialUrl = params.get("url") || "";
  const gameMode = params.get("gameMode") === "true";
  const gameTitle = params.get("title") || "";

  return (
    <div className="h-full">
      <BrowserInterface initialUrl={initialUrl} gameMode={gameMode} gameTitle={gameTitle} key={initialUrl} />
    </div>
  );
}
