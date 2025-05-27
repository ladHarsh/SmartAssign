import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const AssignmentStatistics = ({ assignment }) => {
    // Calculate statistics
    const totalStudents = assignment.enrolledStudents?.length || 0;
    const totalSubmissions = assignment.submissions?.length || 0;
    const submissionRate = totalStudents ? (totalSubmissions / totalStudents) * 100 : 0;
    const gradedSubmissions = assignment.submissions?.filter(sub => sub.grade !== undefined).length || 0;
    const gradingProgress = totalSubmissions ? (gradedSubmissions / totalSubmissions) * 100 : 0;
    const averageGrade = gradedSubmissions ? 
        (assignment.submissions?.reduce((sum, sub) => sum + (sub.grade || 0), 0) || 0) / gradedSubmissions : 0;

    const gradeData = {
        labels: Object.keys(assignment.gradeDistribution),
        datasets: [
            {
                label: 'Number of Students',
                data: Object.values(assignment.gradeDistribution),
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
        ],
    };

    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1rem',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
        }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                Assignment Statistics
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ 
                    backgroundColor: '#eff6ff', 
                    padding: '1rem', 
                    borderRadius: '0.375rem' 
                }}>
                    <h4 style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                        Submission Status
                    </h4>
                    <p style={{ color: '#4b5563', marginBottom: '0.25rem' }}>
                        Total Students: {totalStudents}
                    </p>
                    <p style={{ color: '#4b5563' }}>
                        Submissions: {totalSubmissions} ({Math.round(submissionRate)}%)
                    </p>
                </div>
                
                <div style={{ 
                    backgroundColor: '#f0fdf4', 
                    padding: '1rem', 
                    borderRadius: '0.375rem' 
                }}>
                    <h4 style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                        Grading Progress
                    </h4>
                    <p style={{ color: '#4b5563', marginBottom: '0.25rem' }}>
                        Graded: {gradedSubmissions} ({Math.round(gradingProgress)}%)
                    </p>
                    <p style={{ color: '#4b5563' }}>
                        Average Grade: {Math.round(averageGrade * 10) / 10}
                    </p>
                </div>
            </div>

            <div>
                <h4 style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Recent Submissions
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {assignment.submissions?.slice(0, 5).map((submission) => (
                        <div key={submission._id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.5rem',
                            backgroundColor: '#f9fafb',
                            borderRadius: '0.375rem'
                        }}>
                            <div>
                                <p style={{ fontWeight: '500' }}>{submission.student?.name}</p>
                                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                    {new Date(submission.submittedAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div style={{ fontSize: '0.875rem' }}>
                                {submission.grade !== undefined ? (
                                    <span style={{ color: '#059669', fontWeight: '500' }}>
                                        {submission.grade}/{assignment.maxMarks}
                                    </span>
                                ) : (
                                    <span style={{ color: '#d97706' }}>Pending</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-6">
                <h3 className="font-semibold text-gray-700 mb-4">Grade Distribution</h3>
                <Bar 
                    data={gradeData}
                    options={{
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: 'Grade Distribution'
                            }
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default AssignmentStatistics;