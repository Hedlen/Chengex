import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  User,
  Clock,
  CheckSquare,
  Square,
  UserCheck,
  UserX,
  Activity
} from 'lucide-react';
import { AdminUser, UserRole, ActivityLog } from '../../../shared/types';
import { DataManager } from '../../../shared/api/dataManager';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'editor' as UserRole,
    isActive: true
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadUsers();
    loadActivityLogs();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await DataManager.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivityLogs = async () => {
    try {
      const logs = await DataManager.getActivityLogs();
      setActivityLogs(logs);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      errors.username = '用户名不能为空';
    } else if (formData.username.length < 3) {
      errors.username = '用户名至少3个字符';
    }
    
    if (!formData.email.trim()) {
      errors.email = '邮箱不能为空';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '邮箱格式不正确';
    }
    
    if (!editingUser && !formData.password.trim()) {
      errors.password = '密码不能为空';
    } else if (!editingUser && formData.password.length < 6) {
      errors.password = '密码至少6个字符';
    }
    
    // 检查用户名和邮箱是否已存在
    const existingUser = users.find(user => 
      user.id !== editingUser?.id && 
      (user.username === formData.username || user.email === formData.email)
    );
    
    if (existingUser) {
      if (existingUser.username === formData.username) {
        errors.username = '用户名已存在';
      }
      if (existingUser.email === formData.email) {
        errors.email = '邮箱已存在';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'editor',
      isActive: true
    });
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (editingUser) {
        const updatedUser: AdminUser = {
          ...editingUser,
          username: formData.username.trim(),
          email: formData.email.trim(),
          role: formData.role,
          isActive: formData.isActive,
          updatedAt: new Date().toISOString()
        };
        
        await DataManager.saveUser(updatedUser);
        
        // 记录活动日志
        await DataManager.addActivityLog({
          userId: editingUser.id,
          action: 'update_user',
          details: `更新用户信息: ${formData.username.trim()}`
        });
      } else {
        const newUser: AdminUser = {
          id: '', // 服务器会生成
          username: formData.username.trim(),
          email: formData.email.trim(),
          role: formData.role,
          permissions: formData.role === 'admin' ? ['*'] : [],
          isActive: formData.isActive,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const savedUser = await DataManager.saveUser(newUser);
        
        // 记录活动日志
        await DataManager.addActivityLog({
          userId: savedUser.id,
          action: 'create_user',
          details: `创建新用户: ${formData.username.trim()}`
        });
      }

      await loadUsers();
      await loadActivityLogs();
      setShowAddModal(false);
      setEditingUser(null);
      resetForm();
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.isActive
    });
    setShowAddModal(true);
  };

  const handleDelete = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (user) {
        await DataManager.deleteUser(userId);
        
        // 记录活动日志
        await DataManager.addActivityLog({
          userId: userId,
          action: 'delete_user',
          details: `删除用户: ${user.username}`
        });
        
        await loadUsers();
        await loadActivityLogs();
      }
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleBatchStatusUpdate = async (isActive: boolean) => {
    try {
      for (const userId of selectedUsers) {
        const user = users.find(u => u.id === userId);
        if (user) {
          await DataManager.saveUser({ ...user, isActive });
          
          // 记录活动日志
          await DataManager.addActivityLog({
            userId: user.id,
            action: isActive ? 'activate_user' : 'deactivate_user',
            details: `${isActive ? '激活' : '停用'}用户: ${user.username}`
          });
        }
      }
      await loadUsers();
      await loadActivityLogs();
      setSelectedUsers([]);
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const roleConfig = {
      admin: { label: '管理员', className: 'bg-red-100 text-red-800' },
      editor: { label: '编辑员', className: 'bg-blue-100 text-blue-800' },
      viewer: { label: '查看员', className: 'bg-gray-100 text-gray-800' }
    };

    const config = roleConfig[role] || { label: '未知角色', className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        <Shield className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {isActive ? <UserCheck className="h-3 w-3 mr-1" /> : <UserX className="h-3 w-3 mr-1" />}
        {isActive ? '活跃' : '停用'}
      </span>
    );
  };

  const getActionLabel = (action: string) => {
    const actionLabels: Record<string, string> = {
      create_user: '创建用户',
      update_user: '更新用户',
      delete_user: '删除用户',
      activate_user: '激活用户',
      deactivate_user: '停用用户',
      login: '登录',
      logout: '登出'
    };
    return actionLabels[action] || action;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">用户管理</h1>
        <p className="text-gray-600">管理管理员账户和权限</p>
      </div>

      {/* 工具栏 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜索用户名或邮箱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              options={[
                { value: '', label: '全部角色' },
                { value: 'admin', label: '管理员' },
                { value: 'editor', label: '编辑员' },
                { value: 'viewer', label: '查看员' }
              ]}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
              className="w-full sm:w-40"
            />
            
            <Select
              options={[
                { value: '', label: '全部状态' },
                { value: 'active', label: '活跃' },
                { value: 'inactive', label: '停用' }
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'active' | 'inactive' | '')}
              className="w-full sm:w-40"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowActivityModal(true)}
            >
              <Activity className="h-4 w-4 mr-2" />
              活动日志
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              添加用户
            </Button>
          </div>
        </div>

        {/* 批量操作 */}
        {selectedUsers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                已选择 {selectedUsers.length} 个用户
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleBatchStatusUpdate(true)}
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  批量激活
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleBatchStatusUpdate(false)}
                >
                  <UserX className="h-4 w-4 mr-1" />
                  批量停用
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 用户列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无用户数据</p>
            <Button className="mt-4" onClick={() => setShowAddModal(true)}>
              添加第一个用户
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={handleSelectAll}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {selectedUsers.length === filteredUsers.length ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户信息
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最后登录
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleSelectUser(user.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {selectedUsers.includes(user.id) ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                          <User className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(user.isActive)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {user.lastLogin ? (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(user.lastLogin).toLocaleDateString('zh-CN')}
                        </div>
                      ) : (
                        <span className="text-gray-400">从未登录</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setShowDeleteConfirm(user.id)}
                          disabled={user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 添加/编辑用户模态框 */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingUser(null);
          resetForm();
        }}
        title={editingUser ? '编辑用户' : '添加用户'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="用户名"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            error={formErrors.username}
            placeholder="请输入用户名"
          />
          
          <Input
            label="邮箱"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
            placeholder="请输入邮箱地址"
          />
          
          <Input
            label={editingUser ? "新密码（留空保持不变）" : "密码"}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={formErrors.password}
            placeholder={editingUser ? "留空保持原密码不变" : "请输入密码"}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="角色"
              options={[
                { value: 'admin', label: '管理员' },
                { value: 'editor', label: '编辑员' },
                { value: 'viewer', label: '查看员' }
              ]}
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            />
            
            <Select
              label="状态"
              options={[
                { value: 'true', label: '活跃' },
                { value: 'false', label: '停用' }
              ]}
              value={formData.isActive.toString()}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setEditingUser(null);
                resetForm();
              }}
            >
              取消
            </Button>
            <Button type="submit">
              {editingUser ? '更新' : '添加'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 活动日志模态框 */}
      <Modal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        title="活动日志"
        size="xl"
      >
        <div className="space-y-4">
          {activityLogs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">暂无活动日志</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {activityLogs.slice(0, 50).map((log, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {getActionLabel(log.action)}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(log.timestamp).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* 删除确认模态框 */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="确认删除"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            确定要删除这个用户吗？此操作无法撤销。
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
            >
              取消
            </Button>
            <Button
              variant="danger"
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
            >
              删除
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;