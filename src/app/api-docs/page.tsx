import SwaggerUIViewer from "./SwaggerUI";

export const metadata = {
  title: "API Docs",
};

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-white">
      <SwaggerUIViewer />
    </main>
  );
}
