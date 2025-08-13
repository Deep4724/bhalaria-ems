// "use client";

// import { useState } from "react";

// // Dummy users (replace with Firebase later)
// const dummyUsers = [
//   { id: 1, name: "Raj Mehta", email: "raj@bhalaria.com", role: "Employee" },
//   { id: 2, name: "Kavita Shah", email: "kavita@bhalaria.com", role: "HR" },
//   { id: 3, name: "Amit Patel", email: "amit@bhalaria.com", role: "Admin" },
//   { id: 4, name: "Nisha Jain", email: "nisha@bhalaria.com", role: "Employee" },
// ];

// const roles = ["Super Admin", "Admin", "HR", "Employee"];

// export default function ManageUsersPage() {
//   const [users, setUsers] = useState(dummyUsers);

//   const updateRole = (id: number, newRole: string) => {
//     const updated = users.map((user) =>
//       user.id === id ? { ...user, role: newRole } : user
//     );
//     setUsers(updated);
//     alert(`Updated role for user ID ${id} to ${newRole}`);
//   };

//   return (
//     <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
//       <h1 className="text-3xl font-bold text-blue-600 mb-6 text-center">
//         👥 Manage Users & Assign Roles
//       </h1>

//       <div className="overflow-x-auto">
//         <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow-md">
//           <thead className="bg-gray-100 dark:bg-gray-700">
//             <tr>
//               <th className="text-left px-6 py-3 border-b">Name</th>
//               <th className="text-left px-6 py-3 border-b">Email</th>
//               <th className="text-left px-6 py-3 border-b">Current Role</th>
//               <th className="text-left px-6 py-3 border-b">Change Role</th>
//             </tr>
//           </thead>
//           <tbody>
//             {users.map((user) => (
//               <tr
//                 key={user.id}
//                 className="border-b hover:bg-gray-50 dark:hover:bg-gray-700"
//               >
//                 <td className="px-6 py-4 font-medium">{user.name}</td>
//                 <td className="px-6 py-4">{user.email}</td>
//                 <td className="px-6 py-4">{user.role}</td>
//                 <td className="px-6 py-4">
//                   <select
//                     value={user.role}
//                     onChange={(e) => updateRole(user.id, e.target.value)}
//                     className="p-2 rounded border dark:bg-gray-700"
//                   >
//                     {roles.map((role) => (
//                       <option key={role} value={role}>
//                         {role}
//                       </option>
//                     ))}
//                   </select>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }
