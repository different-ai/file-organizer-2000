'use client'

import { useState, useEffect } from 'react'
import { Bell, CheckCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Task = {
  id: number;
  title: string;
  description: string;
}

export function AppPage() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: "Complete project proposal", description: "Write and submit the project proposal by EOD" },
    { id: 2, title: "Schedule doctor's appointment", description: "Call the clinic to schedule annual check-up" },
    { id: 3, title: "Buy groceries", description: "Pick up milk, eggs, and bread from the store" },
  ])
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  const completeTask = (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId))
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
    }
  }

  const showNotification = () => {
    if (notificationPermission === 'granted') {
      new Notification('hypr Reminder', {
        body: 'You have tasks to complete!',
        icon: '/app-icon.png' // Make sure to add an app icon to your public folder
      })
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">hypr Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-center text-gray-500">No tasks left. Great job!</p>
          ) : (
            <ul className="space-y-4">
              {tasks.map(task => (
                <li key={task.id} className="flex items-start space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => completeTask(task.id)}
                    aria-label={`Complete task: ${task.title}`}
                  >
                    <CheckCircle className="h-6 w-6" />
                  </Button>
                  <div>
                    <h3 className="font-semibold">{task.title}</h3>
                    <p className="text-sm text-gray-600">{task.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {notificationPermission === 'default' && (
            <Button onClick={requestNotificationPermission} className="w-full mb-2">
              Enable Notifications
            </Button>
          )}
          <Button 
            onClick={showNotification} 
            disabled={notificationPermission !== 'granted'}
            className="w-full"
          >
            <Bell className="mr-2 h-4 w-4" /> Send Reminder
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}