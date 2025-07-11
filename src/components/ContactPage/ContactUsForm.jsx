import React, { useEffect, useState } from "react"
import CountryCode from "../../data/countrycode.json"
import { apiConnector } from "../../services/apiconnector"
import { contactusEndpoint } from "../../services/apis"

const ContactUsForm = () => {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        countrycode: CountryCode[0].code,
        phoneNo: "",
        message: "",
    })

    const [errors, setErrors] = useState({})

    const validateForm = () => {
        const newErrors = {}

        if (!formData.firstName.trim()) newErrors.firstName = "Please enter your name."
        if (!formData.email.trim()) newErrors.email = "Please enter your Email address."
        if (!formData.phoneNo.trim()) newErrors.phoneNo = "Please enter your Phone Number."
        else if (formData.phoneNo.length < 10 || formData.phoneNo.length > 12)
            newErrors.phoneNo = "Invalid Phone Number"
        if (!formData.message.trim()) newErrors.message = "Please enter your Message."

        return newErrors
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            return;
        }

        setErrors({});
        try {
            setLoading(true)
            const res = await apiConnector("POST", contactusEndpoint.CONTACT_US_API, formData)
            console.log("Email sent successfully:", res)
            setLoading(false);
            // Reset form after successful submit
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                countrycode: CountryCode[0].code,
                phoneNo: "",
                message: "",
            });
        } catch (error) {
            console.log("ERROR MESSAGE - ", error.message)
            setLoading(false);
        }
    }

    return (
        <form className="flex flex-col gap-7 border border-richblack-600 p-6 rounded-xl" onSubmit={handleSubmit}>
            {/* First & Last Name */}
            <div className="flex flex-col gap-5 lg:flex-row">
                <div className="flex flex-col gap-2 lg:w-[48%]">
                    <label htmlFor="firstName" className="lable-style">First Name</label>
                    <input
                        type="text"
                        name="firstName"
                        id="firstName"
                        value={formData.firstName}
                        placeholder="Enter first name"
                        onChange={handleChange}
                        style={{ boxShadow: "inset 0px -1px 0px rgba(255, 255, 255, 0.18)" }}
                        className="w-full rounded-[0.5rem] bg-richblack-800 p-[12px] text-richblack-5"
                    />
                    {errors.firstName && <span className="-mt-1 text-[12px] text-yellow-100">{errors.firstName}</span>}
                </div>

                <div className="flex flex-col gap-2 lg:w-[48%]">
                    <label htmlFor="lastName" className="lable-style">Last Name</label>
                    <input
                        type="text"
                        name="lastName"
                        id="lastName"
                        value={formData.lastName}
                        placeholder="Enter last name"
                        onChange={handleChange}
                        style={{ boxShadow: "inset 0px -1px 0px rgba(255, 255, 255, 0.18)" }}
                        className="w-full rounded-[0.5rem] bg-richblack-800 p-[12px] text-richblack-5"
                    />
                </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
                <label htmlFor="email" className="lable-style">Email Address</label>
                <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    placeholder="Enter email address"
                    onChange={handleChange}
                    style={{ boxShadow: "inset 0px -1px 0px rgba(255, 255, 255, 0.18)" }}
                    className="w-full rounded-[0.5rem] bg-richblack-800 p-[12px] text-richblack-5"
                />
                {errors.email && <span className="-mt-1 text-[12px] text-yellow-100">{errors.email}</span>}
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-2">
                <label htmlFor="phonenumber" className="lable-style">Phone Number</label>
                <div className="flex gap-5">
                    <div className="flex w-[81px] flex-col gap-2">
                        <select
                            name="countrycode"
                            value={formData.countrycode}
                            onChange={handleChange}
                            style={{ boxShadow: "inset 0px -1px 0px rgba(255, 255, 255, 0.18)" }}
                            className="w-full rounded-[0.5rem] bg-richblack-800 p-[12px] text-richblack-5"
                        >
                            {CountryCode.map((ele, i) => (
                                <option key={i} value={ele.code}>
                                    {ele.code} - {ele.country}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex w-[calc(100%-90px)] flex-col gap-2">
                        <input
                            type="number"
                            name="phoneNo"
                            id="phoneNo"
                            value={formData.phoneNo}
                            placeholder="12345 67890"
                            onChange={handleChange}
                            style={{ boxShadow: "inset 0px -1px 0px rgba(255, 255, 255, 0.18)" }}
                            className="w-full rounded-[0.5rem] bg-richblack-800 p-[12px] text-richblack-5"
                        />
                    </div>
                </div>
                {errors.phoneNo && <span className="-mt-1 text-[12px] text-yellow-100">{errors.phoneNo}</span>}
            </div>

            {/* Message */}
            <div className="flex flex-col gap-2">
                <label htmlFor="message" className="lable-style">Message</label>
                <textarea
                    name="message"
                    id="message"
                    rows="7"
                    value={formData.message}
                    placeholder="Enter your message here"
                    onChange={handleChange}
                    style={{ boxShadow: "inset 0px -1px 0px rgba(255, 255, 255, 0.18)" }}
                    className="w-full rounded-[0.5rem] bg-richblack-800 p-[12px] text-richblack-5"
                ></textarea>
                {errors.message && <span className="-mt-1 text-[12px] text-yellow-100">{errors.message}</span>}
            </div>

            <button
                disabled={loading}
                type="submit"
                className={`rounded-md bg-yellow-50 px-6 py-3 text-center text-[13px] font-bold text-black shadow-[2px_2px_0px_0px_rgba(255,255,255,0.18)] 
        ${!loading && "transition-all duration-200 hover:scale-95 hover:shadow-none"}
        disabled:bg-richblack-500 sm:text-[16px]`}
            >
                {loading ? "Sending..." : "Send Message"}
            </button>
        </form>
    )
}

export default ContactUsForm
