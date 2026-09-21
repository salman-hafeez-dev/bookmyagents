import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { subscriptionService, type Subscription } from "../../../services/subscriptionService";
import { useCurrency } from '../../../hooks/useCurrency';

const PricingArea = () => {
  const currency = useCurrency();
   const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      fetchSubscriptions();
   }, []);

   const fetchSubscriptions = async () => {
      setLoading(true);
      setError(null);
      try {
         const response = await subscriptionService.getSubscriptions();
         console.log("subscriptions data",response);
         setSubscriptions(response.data || []);
      } catch (err: any) {
         console.error('Error fetching subscriptions:', err);
         setError('Failed to load subscription plans. Please try again later.');
      } finally {
         setLoading(false);
      }
   };

   if (loading) {
      return (
         <div className="tg-pricing-area pb-100 pt-125">
            <div className="container">
               <div className="row">
                  <div className="col-lg-12">
                     <div className="tg-location-section-title text-center mb-40">
                        <h5 className="tg-section-subtitle mb-15 wow fadeInUp" data-wow-delay=".3s" data-wow-duration=".9s">Best Holiday Packages</h5>
                        <h2 className="mb-15 text-capitalize wow fadeInUp" data-wow-delay=".4s" data-wow-duration=".9s">Popular Travel Destinations <br /> Available Worldwide</h2>
                     </div>
                  </div>
                  <div className="col-lg-12 text-center">
                     <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                     </div>
                     <p className="mt-3">Loading subscription plans...</p>
                  </div>
               </div>
            </div>
         </div>
      );
   }

   if (error) {
      return (
         <div className="tg-pricing-area pb-100 pt-125">
            <div className="container">
               <div className="row">
                  <div className="col-lg-12">
                     <div className="tg-location-section-title text-center mb-40">
                        <h5 className="tg-section-subtitle mb-15 wow fadeInUp" data-wow-delay=".3s" data-wow-duration=".9s">Best Holiday Packages</h5>
                        <h2 className="mb-15 text-capitalize wow fadeInUp" data-wow-delay=".4s" data-wow-duration=".9s">Popular Travel Destinations <br /> Available Worldwide</h2>
                     </div>
                  </div>
                  <div className="col-lg-12 text-center">
                     <div className="alert alert-danger" role="alert">
                        {error}
                     </div>
                     <button 
                        className="btn btn-primary" 
                        onClick={fetchSubscriptions}
                     >
                        Try Again
                     </button>
                  </div>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="tg-pricing-area pb-100 pt-125">
         <div className="container">
            <div className="row">
               <div className="col-lg-12">
                  <div className="tg-location-section-title text-center mb-40">
                     <h5 className="tg-section-subtitle mb-15 wow fadeInUp" data-wow-delay=".3s" data-wow-duration=".9s">Best Holiday Packages</h5>
                     <h2 className="mb-15 text-capitalize wow fadeInUp" data-wow-delay=".4s" data-wow-duration=".9s">Popular Travel Destinations <br /> Available Worldwide</h2>
                  </div>
               </div>
               {subscriptions.length > 0 ? (
                  subscriptions.map((subscription) => (
                     <div key={subscription._id} className="col-lg-4 col-md-6">
                        <div className={`tg-pricing-wrap mb-30 wow fadeInUp ${subscription.isPopular ? 'popular-plan' : ''}`} data-wow-delay=".3s" data-wow-duration=".9s">
                           {subscription.isPopular && (
                              <div className="popular-badge">
                                 <span>Most Popular</span>
                              </div>
                           )}
                           <div className="tg-pricing-head">
                              <h4 className="tg-pricing-title mb-20">{subscription.name}</h4>
                              <p className="mb-25">{subscription.description || "Perfect for your travel needs"}</p>
                           </div>
                           <div className="tg-pricing-price mb-25">
                              <h2><span>{currency.symbol}</span>{subscription.price.toLocaleString()}</h2>
                              <span className="dates">/month *</span>
                           </div>
                           <div className="tg-pricing-btn mb-40">
                              <Link className="tg-btn text-center w-100" to="/contact">Buy Now</Link>
                           </div>
                           <div className="tg-pricing-list">
                              <ul>
                                 {subscription.features.map((feature, i) => (
                                    <li key={i}>
                                       <span className="icon">
                                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                             <path d="M17 8.26858V9.00458C16.999 10.7297 16.4404 12.4083 15.4075 13.79C14.3745 15.1718 12.9226 16.1826 11.2683 16.6717C9.61394 17.1608 7.8458 17.1021 6.22757 16.5042C4.60934 15.9064 3.22772 14.8015 2.28877 13.3542C1.34981 11.907 0.903833 10.195 1.01734 8.47363C1.13085 6.75223 1.79777 5.11364 2.91862 3.80224C4.03948 2.49083 5.55423 1.57688 7.23695 1.1967C8.91967 0.816507 10.6802 0.990449 12.256 1.69258M17 2.60458L9 10.6126L6.6 8.21258" stroke="#560CE3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                          </svg>
                                       </span>
                                       <span>{feature}</span>
                                    </li>
                                 ))}
                              </ul>
                           </div>
                        </div>
                     </div>
                  ))
               ) : (
                  <div className="col-lg-12 text-center">
                     <div className="alert alert-info" role="alert">
                        No subscription plans available at the moment.
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   )
}

export default PricingArea
