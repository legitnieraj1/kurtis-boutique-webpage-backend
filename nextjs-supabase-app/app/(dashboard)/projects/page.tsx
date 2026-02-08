'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import type { Project } from '@/lib/types';

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', status: 'active' });
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const supabase = createClient();

    const fetchProjects = useCallback(async () => {
        try {
            const response = await fetch('/api/projects');
            const data = await response.json();
            if (response.ok) {
                setProjects(data.projects);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();

        // Set up realtime subscription
        const channel = supabase
            .channel('projects-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'projects' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setProjects((prev) => [payload.new as Project, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setProjects((prev) =>
                            prev.map((p) => (p.id === payload.new.id ? (payload.new as Project) : p))
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setProjects((prev) => prev.filter((p) => p.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchProjects, supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = editingId ? `/api/projects/${editingId}` : '/api/projects';
            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setShowForm(false);
                setFormData({ name: '', description: '', status: 'active' });
                setEditingId(null);
                // Realtime will handle the update
            }
        } catch (error) {
            console.error('Error saving project:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (project: Project) => {
        setFormData({
            name: project.name,
            description: project.description || '',
            status: project.status,
        });
        setEditingId(project.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return;

        try {
            await fetch(`/api/projects/${id}`, { method: 'DELETE' });
            // Realtime will handle the update
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <span className="spinner h-8 w-8 text-primary-600" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage your projects with realtime updates</p>
                </div>
                <button
                    onClick={() => {
                        setFormData({ name: '', description: '', status: 'active' });
                        setEditingId(null);
                        setShowForm(true);
                    }}
                    className="btn btn-primary"
                >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    New Project
                </button>
            </div>

            {/* Project Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="card w-full max-w-md mx-4 animate-fade-in">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            {editingId ? 'Edit Project' : 'New Project'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Project Name
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input"
                                    placeholder="My awesome project"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input min-h-[80px]"
                                    placeholder="Describe your project..."
                                />
                            </div>

                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Status
                                </label>
                                <select
                                    id="status"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="input"
                                >
                                    <option value="active">Active</option>
                                    <option value="completed">Completed</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="btn btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn btn-primary flex-1"
                                >
                                    {saving ? <span className="spinner" /> : editingId ? 'Save' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Projects Grid */}
            {projects.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onEdit={() => handleEdit(project)}
                            onDelete={() => handleDelete(project.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="card text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No projects yet</h3>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Get started by creating your first project.</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="mt-4 btn btn-primary"
                    >
                        Create Project
                    </button>
                </div>
            )}
        </div>
    );
}
