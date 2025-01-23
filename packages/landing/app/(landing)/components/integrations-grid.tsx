interface Integration {
  name: string;
  status: 'active' | 'coming-soon';
  description: string;
  icon?: string | React.ComponentType<{ className?: string }>;
}

interface IntegrationsGridProps {
  title: string;
  subtitle: string;
  integrations: Integration[];
}

export function IntegrationsGrid({ title, subtitle, integrations }: IntegrationsGridProps) {
  return (
    <section className="mb-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        <p className="text-xl text-gray-400">
          {subtitle}
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {integrations.map((tool) => (
          <div
            key={tool.name}
            className={`p-4 rounded-xl border ${
              tool.status === 'active'
                ? 'bg-[#6E45FE]/10 border-[#6E45FE]'
                : 'bg-card border-border opacity-50'
            } text-center relative group hover:scale-105 transition-all duration-200`}
          >
            {tool.icon && (
              <div className="w-8 h-8 mx-auto mb-3">
                {typeof tool.icon === 'string' ? (
                  <div dangerouslySetInnerHTML={{ __html: tool.icon }} />
                ) : (
                  <tool.icon className="w-full h-full" />
                )}
              </div>
            )}
            <span className="font-medium block mb-1">{tool.name}</span>
            <span className="text-sm text-gray-400">{tool.description}</span>
            {tool.status === 'coming-soon' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-medium text-white">
                  Coming Soon
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
} 