import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AttendanceTable from './admin/Attendance';
import LeaveTable from './admin/Leave';

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');
  const userId = 'PUT_LOGGED_IN_USER_ID_HERE';

  return (
    <div>
      <h1>{role === 'admin' ? 'Admin Dashboard' : 'User Dashboard'}</h1>
      {role === 'user' && (
        <>
          <AttendanceTable userId={userId} />
          <LeaveTable userId={userId} />
        </>
      )}
      {role === 'admin' && <h2>All Users / Reports Here</h2>}
    </div>
  );
}
