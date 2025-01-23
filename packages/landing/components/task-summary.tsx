import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Clock, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Define the types here to avoid import issues
type AttentionPower = 'Squirrel' | 'Caffeinated' | 'Hyperfocus' | 'Time Lord';

type Task = {
  id: number;
  name: string;
  description: string;
  dueDate: string;
  attentionPower: AttentionPower;
  timeEstimate: number;
  points: number;
  group: string | null;
  isMainTask?: boolean;
};

type TaskSummaryProps = {
  mainTask: Task;
  subtasks: Task[];
  onTaskClick: (task: Task) => void;
};

const getAttentionPowerIcon = (power: AttentionPower) => {
  switch (power) {
    case 'Squirrel': return '🐿️';
    case 'Caffeinated': return '☕';
    case 'Hyperfocus': return '🎯';
    case 'Time Lord': return '⏳';
  }
};

const getAttentionPowerColor = (power: AttentionPower) => {
  switch (power) {
    case 'Squirrel': return 'bg-green-600';
    case 'Caffeinated': return 'bg-yellow-600';
    case 'Hyperfocus': return 'bg-red-600';
    case 'Time Lord': return 'bg-purple-600';
  }
};

const formatTimeEstimate = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

export function TaskSummary({ mainTask, subtasks, onTaskClick }: TaskSummaryProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <Card className="bg-[#070707] border-2 border-[#26262B] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(110,69,254,0.1)] hover:shadow-[0_0_30px_rgba(110,69,254,0.2)] transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl text-primary">{mainTask.name}</h3>
          <Badge className={`${getAttentionPowerColor(mainTask.attentionPower)} text-white px-3 py-1 text-sm`}>
            {getAttentionPowerIcon(mainTask.attentionPower)} {mainTask.attentionPower}
          </Badge>
        </div>
        <p className="text-gray-400 mb-4">Due: {mainTask.dueDate}</p>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            {formatTimeEstimate(mainTask.timeEstimate)}
          </div>
          <div className="flex items-center">
            <Star className="w-5 h-5 text-gray-400 mr-1" />
            <span className="text-sm text-gray-400">{mainTask.points} pts</span>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between text-gray-400 border-[#26262B] hover:bg-[#1C1D21]"
        >
          {isExpanded ? 'Hide' : 'Show'} Subtasks
          {isExpanded ? <ChevronUp className="h-5 w-5 ml-2" /> : <ChevronDown className="h-5 w-5 ml-2" />}
        </Button>
        {isExpanded && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            {subtasks.map((subtask) => (
              <motion.li
                key={subtask.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-2 bg-[#1C1D21] rounded-md cursor-pointer hover:bg-[#26262B]"
                onClick={() => onTaskClick(subtask)}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">{subtask.name}</span>
                  <Badge className={`${getAttentionPowerColor(subtask.attentionPower)} text-white px-2 py-0.5 text-xs`}>
                    {getAttentionPowerIcon(subtask.attentionPower)}
                  </Badge>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </CardContent>
    </Card>
  );
}