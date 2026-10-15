import { safeExternalUrl } from '../../shared/utils/urls';
export function resolveDemo(projects, origins, projectId, demoId) {
  const project = projects.find((item) => item.id === projectId);
  const demo = project?.demos?.find((item) => item.id === demoId);
  const url = safeExternalUrl(demo?.url);
  if (!demo || !url || !['external', 'embedded', 'hosted', 'simulated'].includes(demo.mode))
    return null;
  return {
    ...demo,
    url,
    project,
    canEmbed: demo.mode !== 'external' && origins.includes(new URL(url).origin),
  };
}
