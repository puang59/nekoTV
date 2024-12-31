"use client";

import { useEffect, useState } from "react";
import React from "react";

export default function WatchPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const resolvedParams = React.use(params);

  return (
    <div>
      <h1>Watch {resolvedParams.name}</h1>
    </div>
  );
}
