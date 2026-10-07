import React, { useState } from 'react';
import { DailyAttendanceTable } from '../../components/attendance/DailyAttendanceTable.tsx';
import { EmployeeDailyInspectionModal } from '../../components/attendance/EmployeeDailyInspectionModal.tsx';

export const HrAttendancePage: React.FC = () => {
  const [inspectingEmpId, setInspectingEmpId] = useState<number | string | null>(null);
  const [inspectingDate, setInspectingDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleInspect = (employeeId: number | string, date: string) => {
    setInspectingEmpId(employeeId);
    setInspectingDate(date);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      <DailyAttendanceTable onInspectEmployee={handleInspect} isAdmin={true} />

      <EmployeeDailyInspectionModal
        isOpen={isModalOpen}
        employeeId={inspectingEmpId}
        date={inspectingDate}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
