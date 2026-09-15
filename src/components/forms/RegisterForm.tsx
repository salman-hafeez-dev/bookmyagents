import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { toast } from "react-toastify"
import { categoryService } from "../../services/categoryService"
import { type Category } from "../../types/category"
import { landingRouteForRole } from "../../utils/landingRoute"

// New agents (no subscription assigned yet) may pick this many categories
// at signup — mirrors the backend's DEFAULT_AGENT_CATEGORY_LIMIT. More can
// be added later from the profile page once a subscription is assigned.
const NEW_AGENT_CATEGORY_LIMIT = 1

const RegisterForm = () => {
   const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'user'
   })
   const [categories, setCategories] = useState<Category[]>([])
   const [selectedCategories, setSelectedCategories] = useState<string[]>([])
   const [loading, setLoading] = useState(false)
   const [showPassword, setShowPassword] = useState(false)
   const [showConfirmPassword, setShowConfirmPassword] = useState(false)
   const { register } = useAuth()
   const navigate = useNavigate()

   useEffect(() => {
      if (formData.role === 'agent' && categories.length === 0) {
         categoryService.getCategories({ limit: 20 })
            .then((res) => setCategories(res.data || []))
            .catch((error) => console.error('Error fetching categories:', error))
      }
   }, [formData.role, categories.length])

   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData({
         ...formData,
         [e.target.name]: e.target.value
      })
      if (e.target.name === 'role' && e.target.value !== 'agent') {
         setSelectedCategories([])
      }
   }

   const handleCategoryToggle = (categoryId: string) => {
      if (selectedCategories.includes(categoryId)) {
         setSelectedCategories(selectedCategories.filter((id) => id !== categoryId))
         return
      }
      if (selectedCategories.length >= NEW_AGENT_CATEGORY_LIMIT) {
         toast.info(`New agents can select up to ${NEW_AGENT_CATEGORY_LIMIT} categor${NEW_AGENT_CATEGORY_LIMIT === 1 ? 'y' : 'ies'}. You can add more later once a subscription is assigned.`)
         return
      }
      setSelectedCategories([...selectedCategories, categoryId])
   }

   const togglePasswordVisibility = () => {
      setShowPassword(!showPassword)
   }

   const toggleConfirmPasswordVisibility = () => {
      setShowConfirmPassword(!showConfirmPassword)
   }

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      
      // Client-side validation
      if (!formData.name.trim()) {
         toast.error('Please enter your name')
         return
      }

      if (!formData.email.trim()) {
         toast.error('Please enter your email')
         return
      }

      if (!formData.password) {
         toast.error('Please enter a password')
         return
      }

      if (formData.password !== formData.confirmPassword) {
         toast.error('Passwords do not match')
         return
      }

      if (formData.password.length < 6) {
         toast.error('Password must be at least 6 characters long')
         return
      }

      if (!formData.role) {
         toast.error('Please select a role')
         return
      }

      setLoading(true)

      try {
         const registeredUser = await register({
            fullName: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
            role: formData.role,
            categories: formData.role === 'agent' ? selectedCategories : undefined
         })
         toast.success('Registration successful! Welcome to TourEx!')
         navigate(landingRouteForRole(registeredUser?.role))
      } catch (error: any) {
         console.error('Registration error:', error)
         const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            'Registration failed. Please try again.'
         toast.error(errorMessage)
      } finally {
         setLoading(false)
      }
   }

   return (
      <form onSubmit={handleSubmit}>
         <div className="row">
            <div className="col-lg-12 mb-25">
               <input 
                  className="input" 
                  type="text" 
                  name="name"
                  placeholder="Enter your username" 
                  value={formData.name}
                  onChange={handleChange}
                  required
               />
            </div>
            <div className="col-lg-12 mb-25">
               <input 
                  className="input" 
                  type="email" 
                  name="email"
                  placeholder="Enter your email" 
                  value={formData.email}
                  onChange={handleChange}
                  required
               />
            </div>
            <div className="col-lg-12 mb-25">
               <select 
                  className="input" 
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  style={{ width: '100%' }}
               >
                  <option value="user">User</option>
                  <option value="agent">Agent</option>
               </select>
            </div>
            {formData.role === 'agent' && (
               <div className="col-lg-12 mb-25">
                  <label className="mb-2 d-block">
                     Service Category
                     <small className="text-muted ms-2">
                        (up to {NEW_AGENT_CATEGORY_LIMIT} for new agents — add more later once a subscription is assigned)
                     </small>
                  </label>
                  <div className="row g-2">
                     {categories.map((category) => (
                        <div key={category._id} className="col-md-6">
                           <div className="form-check">
                              <input
                                 className="form-check-input"
                                 type="checkbox"
                                 id={`register-category-${category._id}`}
                                 checked={selectedCategories.includes(category._id)}
                                 onChange={() => handleCategoryToggle(category._id)}
                              />
                              <label className="form-check-label" htmlFor={`register-category-${category._id}`}>
                                 {category.name}
                              </label>
                           </div>
                        </div>
                     ))}
                     {categories.length === 0 && (
                        <div className="col-12">
                           <small className="text-muted">Loading categories...</small>
                        </div>
                     )}
                  </div>
               </div>
            )}
            <div className="col-lg-12 mb-25">
               <div className="password-input-wrapper" style={{ position: 'relative' }}>
                  <input
                     className="input"
                     type={showPassword ? "text" : "password"}
                     name="password"
                     placeholder="Password" 
                     value={formData.password}
                     onChange={handleChange}
                     required
                     style={{ paddingRight: '45px' }}
                  />
                  <button
                     type="button"
                     onClick={togglePasswordVisibility}
                     style={{
                        position: 'absolute',
                        right: '15px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: '#666'
                     }}
                  >
                     <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                  </button>
               </div>
            </div>
            <div className="col-lg-12 mb-25">
               <div className="password-input-wrapper" style={{ position: 'relative' }}>
                  <input 
                     className="input" 
                     type={showConfirmPassword ? "text" : "password"} 
                     name="confirmPassword"
                     placeholder="Confirm Password" 
                     value={formData.confirmPassword}
                     onChange={handleChange}
                     required
                     style={{ paddingRight: '45px' }}
                  />
                  <button
                     type="button"
                     onClick={toggleConfirmPasswordVisibility}
                     style={{
                        position: 'absolute',
                        right: '15px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: '#666'
                     }}
                  >
                     <i className={showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                  </button>
               </div>
            </div>
            <div className="col-lg-12">
               <div className="d-flex align-items-center justify-content-between">
                  <div className="review-checkbox d-flex align-items-center mb-25">
                     <input className="tg-checkbox" type="checkbox" id="terms" required />
                     <label htmlFor="terms" className="tg-label">I agree to the terms and conditions</label>
                  </div>
                  <div className="tg-login-navigate mb-25">
                     <Link to="/login">Log In</Link>
                  </div>
               </div>
               <button 
                  type="submit" 
                  className="tg-btn w-100" 
                  disabled={loading}
               >
                  {loading ? 'Signing Up...' : 'Sign Up'}
               </button>
            </div>
         </div>
      </form>
   )
}

export default RegisterForm
