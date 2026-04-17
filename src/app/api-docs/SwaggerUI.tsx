"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function SwaggerUIViewer() {
  return <SwaggerUI url="/api/docs" docExpansion="list" />;
}
