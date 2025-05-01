import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useWallet } from '../context/WalletContext';
import { formatAddress } from '../utils/format';

export function Admin() {
  const { isConnected, userRoles } = useWallet();
  const [newRoleAddress, setNewRoleAddress] = useState('');
  const [roleType, setRoleType] = useState<'admin' | 'underwriter'>('underwriter');
  
  // Mock functions for demo purposes
  // In a real app, these would call the backend API
  const handleAddRole = () => {
    alert(`Added ${roleType} role to ${newRoleAddress}`);
    setNewRoleAddress('');
  };
  
  const handleRemoveRole = (address: string, role: string) => {
    alert(`Removed ${role} role from ${address}`);
  };
  
  // Mock data for demo purposes
  const mockAdmins = [
    '0x7937FddC64A43A05EBb8FBF3E4979b78866b3ae2',
    '0x1234567890123456789012345678901234567890',
  ];
  
  const mockUnderwriters = [
    '0x7937FddC64A43A05EBb8FBF3E4979b78866b3ae2',
    '0x2345678901234567890123456789012345678901',
    '0x3456789012345678901234567890123456789012',
  ];
  
  // Check if user is an admin
  const isAdmin = userRoles.isAdmin;
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500">Manage platform settings and user roles</p>
      </div>
      
      {isConnected ? (
        isAdmin ? (
          <>
            <Card className="mb-8">
              <h2 className="text-xl font-medium text-gray-900 mb-4">Add New Role</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Wallet Address"
                    value={newRoleAddress}
                    onChange={(e) => setNewRoleAddress(e.target.value)}
                    placeholder="0x..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Type
                  </label>
                  <select
                    value={roleType}
                    onChange={(e) => setRoleType(e.target.value as 'admin' | 'underwriter')}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="admin">Admin</option>
                    <option value="underwriter">Underwriter</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  onClick={handleAddRole}
                  disabled={!newRoleAddress}
                >
                  Add Role
                </Button>
              </div>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <h2 className="text-xl font-medium text-gray-900 mb-4">Admins</h2>
                {mockAdmins.length > 0 ? (
                  <div className="space-y-4">
                    {mockAdmins.map((address) => (
                      <div key={address} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <div>
                          <p className="font-medium">{formatAddress(address)}</p>
                          <p className="text-xs text-gray-500">{address}</p>
                        </div>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleRemoveRole(address, 'admin')}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No admins found.</p>
                )}
              </Card>
              
              <Card>
                <h2 className="text-xl font-medium text-gray-900 mb-4">Underwriters</h2>
                {mockUnderwriters.length > 0 ? (
                  <div className="space-y-4">
                    {mockUnderwriters.map((address) => (
                      <div key={address} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <div>
                          <p className="font-medium">{formatAddress(address)}</p>
                          <p className="text-xs text-gray-500">{address}</p>
                        </div>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleRemoveRole(address, 'underwriter')}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No underwriters found.</p>
                )}
              </Card>
            </div>
            
            <Card className="mt-8">
              <h2 className="text-xl font-medium text-gray-900 mb-4">Platform Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senior Tranche Yield Rate (%)
                  </label>
                  <input
                    type="number"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    defaultValue="5"
                    min="0"
                    max="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Junior Tranche Yield Rate (%)
                  </label>
                  <input
                    type="number"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    defaultValue="12"
                    min="0"
                    max="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Loan Duration (days)
                  </label>
                  <input
                    type="number"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    defaultValue="30"
                    min="1"
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button>
                  Save Settings
                </Button>
              </div>
            </Card>
          </>
        ) : (
          <Card>
            <div className="text-center py-8">
              <h2 className="text-xl font-medium text-gray-900 mb-4">Access Restricted</h2>
              <p className="text-gray-500 mb-6">
                You need admin permissions to access this page.
              </p>
            </div>
          </Card>
        )
      ) : (
        <Card>
          <div className="text-center py-8">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Connect your wallet</h2>
            <p className="text-gray-500 mb-6">
              You need to connect your wallet to access the admin dashboard.
            </p>
            <Button>Connect Wallet</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
