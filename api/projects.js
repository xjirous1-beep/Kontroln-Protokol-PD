import { createClient } from "@vercel/kv";

const kv = createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
    const { method, body, query } = req;
    
    try {
        switch (method) {
            case 'GET':
                const allProjects = await kv.lrange('projects', 0, -1);
                res.status(200).json(allProjects);
                break;
            case 'POST':
                const newProject = body;
                await kv.lpush('projects', newProject);
                res.status(201).json(newProject);
                break;
            case 'PUT':
                const updatedProject = body;
                let projects = await kv.lrange('projects', 0, -1);
                const projectIndex = projects.findIndex(p => p.id === updatedProject.id);
                if (projectIndex > -1) {
                    projects[projectIndex] = updatedProject;
                    await kv.del('projects');
                    if (projects.length > 0) {
                        await kv.lpush('projects', ...projects.reverse());
                    }
                    res.status(200).json(updatedProject);
                } else {
                    res.status(404).json({ message: 'Project not found.' });
                }
                break;
            case 'DELETE':
                const { id } = query;
                let projectsToDelete = await kv.lrange('projects', 0, -1);
                const filteredProjects = projectsToDelete.filter(p => p.id !== id);
                await kv.del('projects');
                if (filteredProjects.length > 0) {
                     await kv.lpush('projects', ...filteredProjects.reverse());
                }
                res.status(200).json({ message: 'Project deleted successfully.' });
                break;
            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                res.status(405).end(`Method ${method} Not Allowed`);
        }
    } catch (error) {
        console.error("API error:", error);
        res.status(500).json({ message: "Internal Server Error", detail: error.message });
    }
}
