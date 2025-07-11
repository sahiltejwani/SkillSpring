import { toast } from "react-hot-toast"
import { setLoading, setUser } from "../../slice/profileSlice"
import { apiConnector } from "../apiconnector"
import { profileEndpoints } from "../apis"
import { logout } from "./authAPI"
const { GET_USER_DETAILS_API, GET_USER_ENROLLED_COURSES_API, GET_INSTRUCTOR_DATA_API } = profileEndpoints
import { setProgress } from "../../slice/loadingBarSlice"

export function getUserDetails(token, navigate) {
    return async (dispatch) => {
        const toastId = toast.loading("Loading...")
        dispatch(setLoading(true))
        try {
            const response = await apiConnector("GET", GET_USER_DETAILS_API, null, {
                Authorization: `Bearer ${token}`,
            })
            console.log("GET_USER_DETAILS API RESPONSE............", response)

            if (!response.data.success) {
                throw new Error(response.data.message)
            }
            const userImage = response.data.data.image
                ? response.data.data.image
                : `https://api.dicebear.com/5.x/initials/svg?seed=${response.data.data.firstName} ${response.data.data.lastName}`
            dispatch(setUser({ ...response.data.data, image: userImage }))
        } catch (error) {
            dispatch(logout(navigate))
            console.log("GET_USER_DETAILS API ERROR............", error)
            toast.error("Could Not Get User Details")
        }
        toast.dismiss(toastId)
        dispatch(setLoading(false))
    }
}

export async function getUserEnrolledCourses(token) {
    const toastId = toast.loading("Loading...")
    let result = [];
    console.log("TOKEN USED FOR ENROLLED COURSES:", token);

    try {
        console.log("BEFORE Calling BACKEND API FOR ENROLLED COURSES");
        const response = await apiConnector(
            "GET",
            GET_USER_ENROLLED_COURSES_API,
            null,
            {
                Authorization: `Bearer ${token}`,
            }
        )
        console.log("AFTER Calling BACKEND API FOR ENROLLED COURSES");
        // console.log(
        //   "GET_USER_ENROLLED_COURSES_API API RESPONSE............",
        //   response
        // )

        if (!response.data.success) {
            throw new Error(response.data.message)
        }
        result = response.data.data
    } catch (error) {
        console.log("GET_USER_ENROLLED_COURSES_API ERROR:", error?.response?.data || error.message);
        toast.error("Could Not Get Enrolled Courses");
    }
    toast.dismiss(toastId)
    return result
}

// export async function getInstructorData(token) {
//     const toastId = toast.loading("Loading...");
//     let result = [];
//     try {
//         const response = await apiConnector("GET", GET_INSTRUCTOR_DATA_API, null,
//             {
//                 Authorization: `Bearer ${token}`,
//             })

//         console.log("GET_INSTRUCTOR_API_RESPONSE", response);
//         result = response?.data?.data?.courses;
        

//     }
//     catch (error) {
//         console.log("GET_INSTRUCTOR_API ERROR", error);
//         toast.error("Could not Get Instructor Data")
//     }
//     toast.dismiss(toastId);
//     return result;  
// }

export async function getInstructorDashboard(token,dispatch){
  // const toastId = toast.loading("Loading...");
  dispatch(setProgress);
  let result = []
  try {
    console.log("BEFORE Calling BACKEND API FOR INSTRUCTOR DASHBOARD");
    const response = await apiConnector(
      "GET",
      profileEndpoints.GET_ALL_INSTRUCTOR_DASHBOARD_DETAILS_API,
      null,
      {
        Authorization: `Bearer ${token}`,
      }
    )
    console.log("AFTER Calling BACKEND API FOR INSTRUCTOR DASHBOARD");
    console.log(
      "GET_INSTRUCTOR_DASHBOARD_API API RESPONSE............",
      response
    )

    if (!response.data.success) {
      throw new Error(response.data.message)
    }
    result = response.data.data;
  } catch (error) {
    console.log("GET_INSTRUCTOR_DASHBOARD_API API ERROR............", error)
    toast.error("Could Not Get Instructor Dashboard")
  }
  dispatch(setProgress(100));
  // toast.dismiss(toastId)
  return result
}