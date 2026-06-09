import { useState, useEffect, useRef } from 'react'
import { getMyGroups, createGroup, getGroupMessages, sendMessage, getUsers } from '../services/api'
import { connectSocket, joinGroup, sendSocketMessage, onReceiveMessage, offReceiveMessage, getSocket } from '../services/socket'
import useAuth from '../hooks/useAuth'

function Chat() {
  const { user, token } = useAuth()
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [users, setUsers] = useState([])
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [groupForm, setGroupForm] = useState({ name: '', type: 'custom', memberIds: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const isManagerOrOwner = user.role === 'owner' || user.role === 'manager'

  useEffect(() => {
    if (!getSocket()) {
      connectSocket(token)
    }
    fetchGroups()
    if (isManagerOrOwner) fetchUsers()
  }, [])

  useEffect(() => {
    if (selectedGroup) {
      fetchMessages(selectedGroup._id)
      joinGroup(selectedGroup._id)
      onReceiveMessage((data) => {
        setMessages(prev => [...prev, data])
      })
    }
    return () => offReceiveMessage()
  }, [selectedGroup])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchGroups = async () => {
    try {
      const res = await getMyGroups()
      setGroups(res.data)
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (groupId) => {
    try {
      const res = await getGroupMessages(groupId)
      setMessages(res.data)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await getUsers()
      setUsers(res.data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedGroup) return

    try {
      const res = await sendMessage(selectedGroup._id, { content: newMessage })
      sendSocketMessage({
        ...res.data.data,
        groupId: selectedGroup._id,
      })
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleCreateGroup = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await createGroup(groupForm)
      setGroupForm({ name: '', type: 'custom', memberIds: [] })
      setShowCreateGroup(false)
      fetchGroups()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group')
    }
  }

  const toggleMember = (userId) => {
    setGroupForm(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId)
        ? prev.memberIds.filter(id => id !== userId)
        : [...prev.memberIds, userId],
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      <div className="w-64 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Groups</h2>
          {isManagerOrOwner && (
            <button
              onClick={() => setShowCreateGroup(!showCreateGroup)}
              className="text-indigo-600 text-xs font-medium hover:underline"
            >
              + New
            </button>
          )}
        </div>

        {showCreateGroup && isManagerOrOwner && (
          <div className="p-4 border-b border-gray-100">
            <form onSubmit={handleCreateGroup} className="flex flex-col gap-2">
              <input
                value={groupForm.name}
                onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
                placeholder="Group name"
                required
                className="border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={groupForm.type}
                onChange={e => setGroupForm({ ...groupForm, type: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="custom">Custom</option>
                <option value="general">General</option>
                <option value="managers">Managers Only</option>
              </select>
              <div className="flex flex-col gap-1">
                <p className="text-xs text-gray-500">Add members:</p>
                {users.filter(u => u._id !== user.id).map(u => (
                  <label key={u._id} className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="checkbox"
                      checked={groupForm.memberIds.includes(u._id)}
                      onChange={() => toggleMember(u._id)}
                    />
                    {u.firstName} {u.lastName}
                  </label>
                ))}
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                type="submit"
                className="bg-indigo-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
              >
                Create Group
              </button>
            </form>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {groups.length === 0 ? (
            <p className="text-gray-400 text-xs p-4">No groups yet</p>
          ) : (
            groups.map(group => (
              <button
                key={group._id}
                onClick={() => setSelectedGroup(group)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition border-b border-gray-50 ${
                  selectedGroup?._id === group._id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'
                }`}
              >
                <p className="font-medium">{group.name}</p>
                <p className="text-xs text-gray-400 capitalize">{group.type} · {group.members.length} members</p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
        {!selectedGroup ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400 text-sm">Select a group to start chatting</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">{selectedGroup.name}</h2>
              <p className="text-xs text-gray-400">{selectedGroup.members.length} members</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {messages.length === 0 ? (
                <p className="text-gray-400 text-sm text-center mt-10">No messages yet. Say hello!</p>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg._id}
                    className={`flex flex-col ${msg.senderId?._id === user.id ? 'items-end' : 'items-start'}`}
                  >
                    <p className="text-xs text-gray-400 mb-1">
                      {msg.senderId?.firstName} {msg.senderId?.lastName}
                    </p>
                    <div className={`px-4 py-2 rounded-xl text-sm max-w-xs ${
                      msg.senderId?._id === user.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {msg.content}
                    </div>
                    <p className="text-xs text-gray-300 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 flex gap-2">
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default Chat