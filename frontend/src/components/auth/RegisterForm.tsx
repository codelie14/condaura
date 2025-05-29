import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const RegisterForm: React.FC = () => {
  const { register, error, clearError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Confirm password is required'),
    first_name: Yup.string()
      .required('First name is required'),
    last_name: Yup.string()
      .required('Last name is required'),
    department: Yup.string()
      .required('Department is required')
  });

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      first_name: '',
      last_name: '',
      department: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        clearError();
        setBackendError(null);
        
        // Map form values to API expected format
        const registerData = {
          email: values.email,
          password: values.password,
          first_name: values.first_name,
          last_name: values.last_name,
          department: values.department
        };
        
        console.log('Submitting registration data:', registerData);
        await register(registerData);
        navigate('/dashboard');
      } catch (error: any) {
        console.error('Registration error:', error);
        if (error.response?.data) {
          // Format backend error messages
          const errorData = error.response.data;
          const errorMessages = [];
          
          for (const key in errorData) {
            if (Array.isArray(errorData[key])) {
              errorMessages.push(`${key}: ${errorData[key].join(', ')}`);
            } else if (typeof errorData[key] === 'string') {
              errorMessages.push(`${key}: ${errorData[key]}`);
            }
          }
          
          setBackendError(errorMessages.join('\n'));
        } else {
          setBackendError('Registration failed. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Create an Account</h2>
      
      {(error || backendError) && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error || backendError}
        </div>
      )}
      
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              className="input"
              value={formik.values.first_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.first_name && formik.errors.first_name ? (
              <p className="mt-1 text-sm text-red-600">{formik.errors.first_name}</p>
            ) : null}
          </div>
          
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              className="input"
              value={formik.values.last_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.last_name && formik.errors.last_name ? (
              <p className="mt-1 text-sm text-red-600">{formik.errors.last_name}</p>
            ) : null}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="input"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.email && formik.errors.email ? (
            <p className="mt-1 text-sm text-red-600">{formik.errors.email}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
          <input
            id="department"
            name="department"
            type="text"
            className="input"
            value={formik.values.department}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.department && formik.errors.department ? (
            <p className="mt-1 text-sm text-red-600">{formik.errors.department}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            className="input"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.password && formik.errors.password ? (
            <p className="mt-1 text-sm text-red-600">{formik.errors.password}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="input"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
            <p className="mt-1 text-sm text-red-600">{formik.errors.confirmPassword}</p>
          ) : null}
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full flex justify-center py-2"
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-accent1 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm; 