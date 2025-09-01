import { kv } from "@vercel/kv";

export default async function handler(req, res) {
    const { method } = req;

    try {
        switch (method) {
            case 'GET':
                // Načtení všech projektů z databáze
                const allProjects = await kv.lrange('projects', 0, -1);
                res.status(200).json(allProjects);
                break;
            case 'POST':
                // Uložení nového projektu
                const newProject = req.body;
                await kv.lpush('projects', newProject);
                res.status(201).json(newProject);
                break;
            case 'PUT':
                // Aktualizace existujícího projektu
                const updatedProject = req.body;
                // Zde bude složitější logika pro nalezení a aktualizaci projektu v seznamu
                // Zjednodušená verze: Načteme všechny projekty, najdeme ten, který chceme aktualizovat, a uložíme zpět
                let projects = await kv.lrange('projects', 0, -1);
                const projectIndex = projects.findIndex(p => p.id === updatedProject.id);
                if (projectIndex > -1) {
                    projects[projectIndex] = updatedProject;
                    // Pro zjednodušení vymažeme a nahradíme celý seznam
                    await kv.del('projects');
                    await kv.lpush('projects', ...projects.reverse());
                    res.status(200).json(updatedProject);
                } else {
                    res.status(404).json({ message: 'Project not found.' });
                }
                break;
            case 'DELETE':
                // Smazání projektu
                const { id } = req.query;
                // Stejně jako u PUT, zjednodušená verze
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
        res.status(500).json({ message: "Internal Server Error" });
    }
}
