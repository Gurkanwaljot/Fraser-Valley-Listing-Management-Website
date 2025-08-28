import React from 'react';
import { getExt } from './helpers';
import { fileIcon } from './helpers';

export default function FilesGrid({ items = {}, title }) {
  if (!items.length) return null;
  return (
    <section className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow p-6 text-center max-w-6xl mx-auto">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        {title}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {items.map((f, i) => {
          const ext = getExt(f.url)?.toLowerCase();
          const meta = fileIcon(ext);
          const name =
            f.url?.split('/').pop()?.replace(/\d+-/g, '') || `file-${i + 1}`;

          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);

          return (
            <a
              key={i}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow transition bg-white/70 dark:bg-gray-900/40"
              title={name}
            >
              <div className="w-full aspect-square rounded-md overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                {isImage ? (
                  <img
                    src={f.url}
                    alt={name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center">
                   <i className={`fas ${meta.icon} text-4xl ${meta.tone}`} />
                  </div>
                )}
              </div>
              <div className="mt-3">
                <p className="text-base font-medium text-gray-800 dark:text-gray-200 truncate">
                  {name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {ext?.toUpperCase()}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
