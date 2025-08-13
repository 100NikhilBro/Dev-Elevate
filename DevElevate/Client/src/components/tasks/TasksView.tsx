import React, { useState } from 'react';
import { Plus, Search, Filter, Calendar, User, Clock, Target, ArrowRight, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/modal';
import { Dropdown } from '../ui/Dropdown';
import { Task, useTasks } from '../../contexts/AppContext';
import { formatDate, generateId, getPriorityColor, getStatusColor } from '../../utils/helperAI';

export const TasksView: React.FC = () => {
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    dueDate: '',
    assignedTo: '',
    tags: [] as string[],
  });

  // Safety check for tasks
  if (!tasks) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="mx-auto mb-4 w-8 h-8 rounded-full border-4 border-blue-500 animate-spin border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading tasks...</p>
        </div>
      </div>
    );
  }

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const tasksByStatus = {
    todo: filteredTasks.filter(task => task.status === 'todo'),
    'in-progress': filteredTasks.filter(task => task.status === 'in-progress'),
    done: filteredTasks.filter(task => task.status === 'done'),
  };

  const handleCreateTask = () => {
    if (!newTask.title.trim()) return;

    const task: Task = {
      id: generateId(),
      title: newTask.title,
      description: newTask.description,
      status: 'todo',
      priority: newTask.priority,
      dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
      assignedTo: newTask.assignedTo || undefined,
      createdBy: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
      subtasks: [],
      tags: newTask.tags,
    };

    addTask(task);
    setIsCreateModalOpen(false);
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      assignedTo: '',
      tags: [],
    });
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    updateTask(taskId, { ...updates, updatedAt: new Date() });
  };

  const handleStatusChange = (taskId: string, status: Task['status']) => {
    handleUpdateTask(taskId, { status });
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return <Circle size={16} className="text-gray-500" />;
      case 'in-progress':
        return <Clock size={16} className="text-blue-500" />;
      case 'done':
        return <CheckCircle size={16} className="text-green-500" />;
    }
  };

  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle size={16} className="text-red-500" />;
      case 'high':
        return <ArrowRight size={16} className="text-orange-500" />;
      case 'medium':
        return <Target size={16} className="text-yellow-500" />;
      case 'low':
        return <Circle size={16} className="text-green-500" />;
    }
  };

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <div
      className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700 hover:shadow-md"
      onClick={() => setSelectedTask(task)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const nextStatus = task.status === 'todo' ? 'in-progress' : 
                              task.status === 'in-progress' ? 'done' : 'todo';
              handleStatusChange(task.id, nextStatus);
            }}
          >
            {getStatusIcon(task.status)}
          </button>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {task.title}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {task.description}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getPriorityIcon(task.priority)}
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          {task.dueDate && (
            <span className="flex items-center">
              <Calendar size={14} className="mr-1" />
              {formatDate(task.dueDate)}
            </span>
          )}
          {task.assignedTo && (
            <span className="flex items-center">
              <User size={14} className="mr-1" />
              {task.assignedTo}
            </span>
          )}
        </div>
        
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
          {task.status.replace('-', ' ')}
        </span>
      </div>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {task.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const KanbanColumn: React.FC<{ title: string; status: Task['status']; tasks: Task[] }> = ({ 
    title, 
    status, 
    tasks 
  }) => (
    <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-900">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-900 dark:text-white">
          {title} ({tasks.length})
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={16} />
        </Button>
      </div>
      <div className="space-y-3">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {tasks.length} tasks • {tasksByStatus.todo.length} todo, {tasksByStatus['in-progress'].length} in progress, {tasksByStatus.done.length} done
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex p-1 bg-gray-200 rounded-lg dark:bg-gray-700">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'kanban' 
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Kanban
            </button>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={16} className="mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={16} />}
          />
        </div>
        <Button variant="outline">
          <Filter size={16} className="mr-2" />
          Filter
        </Button>
      </div>

      {/* Tasks Display */}
      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <>
          <div className="p-4 mb-4 text-sm text-yellow-800 bg-yellow-50 rounded-lg border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-200">
            <strong>What is Kanban?</strong> Kanban is a simple, visual way to manage your work. Tasks move through columns like To Do, In Progress, and Done, making it easy to see what needs attention and what is finished.
          </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <KanbanColumn
            title="To Do"
            status="todo"
            tasks={tasksByStatus.todo}
          />
          <KanbanColumn
            title="In Progress"
            status="in-progress"
            tasks={tasksByStatus['in-progress']}
          />
          <KanbanColumn
            title="Done"
            status="done"
            tasks={tasksByStatus.done}
          />
        </div>
        </>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Task"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            placeholder="Task title..."
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          />
          
          <textarea
            placeholder="Task description..."
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            rows={4}
            className="p-3 w-full text-gray-900 bg-white rounded-lg border border-gray-300 resize-none dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="grid grid-cols-2 gap-4">
            <Dropdown
              options={[
                { value: 'low', label: 'Low Priority' },
                { value: 'medium', label: 'Medium Priority' },
                { value: 'high', label: 'High Priority' },
                { value: 'urgent', label: 'Urgent Priority' },
              ]}
              value={newTask.priority}
              onChange={(value) => setNewTask({ ...newTask, priority: value as Task['priority'] })}
            />
            
            <Input
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              label="Due Date"
            />
          </div>

          <Input
            placeholder="Assigned to..."
            value={newTask.assignedTo}
            onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
          />

          <Input
            placeholder="Tags (comma separated)..."
            value={newTask.tags.join(', ')}
            onChange={(e) => setNewTask({ 
              ...newTask, 
              tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
            })}
          />

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateTask}
            >
              Create Task
            </Button>
          </div>
        </div>
      </Modal>

      {/* Task Detail Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={selectedTask?.title || 'Task Details'}
        size="lg"
      >
        {selectedTask && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedTask.status)}`}>
                {selectedTask.status.replace('-', ' ')}
              </span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(selectedTask.priority)}`}>
                {selectedTask.priority} priority
              </span>
            </div>

            <div>
              <h3 className="mb-2 font-medium text-gray-900 dark:text-white">Description</h3>
              <p className="text-gray-600 dark:text-gray-400">{selectedTask.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Created</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(selectedTask.createdAt)}
                </p>
              </div>
              {selectedTask.dueDate && (
                <div>
                  <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Due Date</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(selectedTask.dueDate)}
                  </p>
                </div>
              )}
            </div>

            {selectedTask.tags.length > 0 && (
              <div>
                <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-sm text-gray-600 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setSelectedTask(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  const nextStatus = selectedTask.status === 'todo' ? 'in-progress' : 
                                  selectedTask.status === 'in-progress' ? 'done' : 'todo';
                  handleStatusChange(selectedTask.id, nextStatus);
                  setSelectedTask(null);
                }}
              >
                {selectedTask.status === 'todo' ? 'Start Task' : 
                 selectedTask.status === 'in-progress' ? 'Complete Task' : 'Reopen Task'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
