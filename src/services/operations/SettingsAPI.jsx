import { toast } from "react-hot-toast"
import { setUser } from "../../slice/profileSlice"

import { apiConnector } from "../apiconnector"
import { settingsEndpoints } from "../apis"
import { logout } from "./authAPI"

const {
    UPDATE_DISPLAY_PICTURE_API,
    UPDATE_PROFILE_API,
    CHANGE_PASSWORD_API,
    DELETE_PROFILE_API,
} = settingsEndpoints

export async function updateDisplayPicture(token, formData, dispatch) {
    const toastId = toast.loading("Loading...")
    try {
        const response = await apiConnector(
            "PUT",
            UPDATE_DISPLAY_PICTURE_API,
            formData,
            {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${token}`,
            }
        )
        console.log(
            "UPDATE_DISPLAY_PICTURE_API API RESPONSE............",
            response
        )
        dispatch(setUser(response.data.data));
        if (!response.data.success) {
            throw new Error(response.data.message)
        }
        toast.success("Display Picture Updated Successfully")
        dispatch(setUser(response.data.data))
    } catch (error) {
        console.log(error.message);
        console.log("UPDATE_DISPLAY_PICTURE_API API ERROR............", error)
        toast.error("Could Not Update Display Picture")
    }
    toast.dismiss(toastId)
}

export async function updateProfile(token, formData, dispatch) {
    const toastId = toast.loading("Loading...");
    try {
        const response = await apiConnector("PUT", UPDATE_PROFILE_API, formData, {
            Authorization: `Bearer ${token}`,
        });

        if (!response.data.success) {
            throw new Error(response.data.message);
        }

        const updatedUserDetails = response.data.data;
        const userImage = updatedUserDetails.image
            ? updatedUserDetails.image
            : `https://api.dicebear.com/5.x/initials/svg?seed=${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`;

        const fullUserData = { ...updatedUserDetails, image: userImage };
        dispatch(setUser(fullUserData));

        // dispatch(logout(navigate));
        toast.success("Profile Updated Successfully");
        return fullUserData;
    } catch (error) {
        console.log("UPDATE_PROFILE_API ERROR: ", error);
        toast.error("Could Not Update Profile");
    } finally {
        toast.dismiss(toastId);
    }
}




export async function changePassword(token, formData) {
    const toastId = toast.loading("Loading...")
    try {
        const response = await apiConnector("POST", CHANGE_PASSWORD_API, formData, {
            Authorization: `Bearer ${token}`,
        })
        console.log("CHANGE_PASSWORD_API API RESPONSE............", response)

        if (!response.data.success) {
            throw new Error(response.data.message)
        }
        toast.success("Password Changed Successfully")
    } catch (error) {
        console.log("CHANGE_PASSWORD_API API ERROR............", error)
        toast.error(error.response.data.message)
    }
    toast.dismiss(toastId)
}

export async function deleteProfile(token, navigate, dispatch) {
    const toastId = toast.loading("Loading...")
    try {
        const response = await apiConnector("DELETE", DELETE_PROFILE_API, null, {
            Authorization: `Bearer ${token}`,
        })
        console.log("DELETE_PROFILE_API API RESPONSE............", response)

        if (!response.data.success) {
            throw new Error(response.data.message)
        }
        toast.success("Profile Deleted Successfully")
        dispatch(logout(navigate))
    } catch (error) {
        console.log("DELETE_PROFILE_API API ERROR............", error)
        toast.error("Could Not Delete Profile")
    }
    toast.dismiss(toastId)
}
