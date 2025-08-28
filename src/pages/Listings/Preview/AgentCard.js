import React from "react";
import { initials } from "./helpers";

export default function AgentCard({ agent }) {
  const agentPhoto = agent?.images?.find((img) => img.altText === "agent-photo")?.url;

  // Prefer email for CONTACT; fall back to phone; otherwise no-op link
  const contactHref = agent?.email
    ? `mailto:${agent.email}`
    : agent?.phone
    ? `tel:${agent.phone}`
    : "#";

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
      {/* Top: avatar on the left (like the screenshot) */}
      <div className="flex items-center gap-4">
        {agentPhoto ? (
          <img
            src={agentPhoto}
            alt={agent?.name ? `${agent.name} headshot` : "Agent photo"}
            className="h-20 w-20 rounded-50 object-cover"
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-orange-500 text-white grid place-content-center text-2xl font-semibold">
            {initials(agent?.name)}
          </div>
        )}
      </div>

      {/* Thin divider under avatar */}
      <hr className="my-4 border-gray-200 dark:border-gray-700" />

      {/* Details (left-aligned, like the screenshot) */}
      <div className="space-y-1">
        <p className="text-base font-medium text-gray-900 dark:text-gray-100">
          {agent?.name || "—"}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {agent?.title || "Listing Agent"}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {agent?.phone ? agent.phone : "—"}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 break-all">
          {agent?.email ? agent.email : "—"}
        </p>
      </div>

      {/* CONTACT link (pink, like the screenshot) */}
      {(agent?.email || agent?.phone) && (
        <a
          href={contactHref}
          className="mt-4 inline-block font-semibold text-pink-600 hover:underline"
        >
          CONTACT
        </a>
      )}
    </div>
  );
}
