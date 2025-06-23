import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import contactService from "@/services/api/contactService";
import { create, getAll } from "@/services/api/customFieldService";
import taskService from "@/services/api/taskService";
import ApperIcon from "@/components/ApperIcon";
import Tasks from "@/components/pages/Tasks";
import TaskItem from "@/components/molecules/TaskItem";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    contactId: '',
    dealId: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, filter]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksResult, contactsResult] = await Promise.all([
        taskService.getAll(),
        contactService.getAll()
      ]);
      setTasks(tasksResult);
      setContacts(contactsResult);
    } catch (err) {
      setError(err.message || 'Failed to load tasks');
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];
    
    switch (filter) {
      case 'pending':
        filtered = tasks.filter(t => t.status === 'pending');
        break;
      case 'in-progress':
        filtered = tasks.filter(t => t.status === 'in-progress');
        break;
      case 'completed':
        filtered = tasks.filter(t => t.status === 'completed');
        break;
      case 'overdue':
        filtered = tasks.filter(t => t.status === 'overdue' || 
          (t.status !== 'completed' && new Date(t.dueDate) < new Date()));
        break;
      case 'high-priority':
        filtered = tasks.filter(t => t.priority === 'high');
        break;
      default:
        filtered = tasks;
    }
    
    setFilteredTasks(filtered);
  };

  const getContactById = (contactId) => {
    return contacts.find(c => c.Id === contactId);
  };

  const handleComplete = async (task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await taskService.updateStatus(task.Id, newStatus);
      await loadData();
      toast.success(newStatus === 'completed' ? 'Task completed!' : 'Task reopened');
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

const handleEdit = (task) => {
    console.log('Edit task:', task);
    toast.info('Edit functionality coming soon');
  };

  const handleAddTask = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      contactId: '',
      dealId: ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      contactId: '',
      dealId: ''
    });
    setFormErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.dueDate) {
      errors.dueDate = 'Due date is required';
    } else {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        errors.dueDate = 'Due date cannot be in the past';
      }
    }
    
    if (!formData.priority) {
      errors.priority = 'Priority is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    try {
      const taskData = {
        ...formData,
        contactId: formData.contactId ? parseInt(formData.contactId, 10) : null,
        dealId: formData.dealId ? parseInt(formData.dealId, 10) : null,
        dueDate: new Date(formData.dueDate).toISOString()
      };
      
      await taskService.create(taskData);
      await loadData();
      handleCloseModal();
      toast.success('Task created successfully');
    } catch (err) {
      toast.error('Failed to create task');
      console.error('Error creating task:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (task) => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      try {
        await taskService.delete(task.Id);
        await loadData();
        toast.success('Task deleted successfully');
      } catch (err) {
        toast.error('Failed to delete task');
      }
    }
  };

  const getFilterCount = (filterType) => {
    switch (filterType) {
      case 'pending':
        return tasks.filter(t => t.status === 'pending').length;
      case 'in-progress':
        return tasks.filter(t => t.status === 'in-progress').length;
      case 'completed':
        return tasks.filter(t => t.status === 'completed').length;
      case 'overdue':
        return tasks.filter(t => t.status === 'overdue' || 
          (t.status !== 'completed' && new Date(t.dueDate) < new Date())).length;
      case 'high-priority':
        return tasks.filter(t => t.priority === 'high').length;
      default:
        return tasks.length;
    }
  };

  const filters = [
    { key: 'all', label: 'All Tasks', count: getFilterCount('all') },
    { key: 'pending', label: 'Pending', count: getFilterCount('pending') },
    { key: 'in-progress', label: 'In Progress', count: getFilterCount('in-progress') },
    { key: 'completed', label: 'Completed', count: getFilterCount('completed') },
    { key: 'overdue', label: 'Overdue', count: getFilterCount('overdue') },
    { key: 'high-priority', label: 'High Priority', count: getFilterCount('high-priority') }
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-lg p-4 shadow-sm"
          >
            <div className="animate-pulse space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                <div className="h-6 bg-gray-200 rounded-full w-20"></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <ApperIcon name="AlertCircle" className="w-8 h-8 text-error" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Tasks</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={loadData} variant="primary">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === filterOption.key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption.label}
              <Badge 
                variant={filter === filterOption.key ? 'default' : 'primary'} 
                size="sm"
                className={filter === filterOption.key ? 'bg-white/20 text-white' : ''}
              >
                {filterOption.count}
              </Badge>
            </button>
          ))}
        </div>

<Button 
          onClick={handleAddTask}
          variant="primary"
          icon="Plus"
          className="w-full sm:w-auto"
        >
          Add Task
        </Button>
      </div>

      {filteredTasks.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ApperIcon name="CheckSquare" className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === 'all' ? 'No Tasks Yet' : `No ${filters.find(f => f.key === filter)?.label} Tasks`}
          </h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all' ? 'Get started by creating your first task' : 'Try switching to a different filter'}
          </p>
{filter === 'all' && (
            <Button 
              onClick={handleAddTask}
              variant="primary"
              icon="Plus"
            >
              Add Task
            </Button>
          )}
        </div>
      )}

      <div className="space-y-4">
        <AnimatePresence>
          {filteredTasks.map((task, index) => (
            <motion.div
              key={task.Id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <TaskItem
                task={task}
                contact={getContactById(task.contactId)}
                onComplete={handleComplete}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </motion.div>
          ))}
        </AnimatePresence>
</div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <div className="bg-white rounded-lg shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Add New Task</h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ApperIcon name="X" size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <Input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter task title"
                      error={formErrors.title}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter task description"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority *
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      {formErrors.priority && (
                        <p className="mt-1 text-sm text-error">{formErrors.priority}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date *
                      </label>
                      <Input
                        type="datetime-local"
                        value={formData.dueDate}
                        onChange={(e) => handleInputChange('dueDate', e.target.value)}
                        error={formErrors.dueDate}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact (Optional)
                      </label>
                      <select
                        value={formData.contactId}
                        onChange={(e) => handleInputChange('contactId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">Select contact</option>
                        {contacts.map((contact) => (
                          <option key={contact.Id} value={contact.Id}>
                            {contact.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deal (Optional)
                      </label>
                      <select
                        value={formData.dealId}
                        onChange={(e) => handleInputChange('dealId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">Select deal</option>
                        {/* Note: Would need deal data to populate this */}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleCloseModal}
                      className="flex-1"
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      className="flex-1"
                      disabled={submitting}
                    >
                      {submitting ? 'Creating...' : 'Create Task'}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskList;