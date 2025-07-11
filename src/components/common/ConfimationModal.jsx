import React, { useRef } from "react"
import useOnClickOutside from "../../hooks/useOnClickOutside"
const ConfirmationModal = ({ modalData }) => {
    const ref = useRef(null)

    // Close modal on outside click
    useOnClickOutside(ref, () => modalData.btn2Handler())

    return (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-transparent bg-opacity-50 backdrop-blur-sm">
            <div
                ref={ref}
                className="w-[90%] max-w-[400px] rounded-lg border border-richblack-700 bg-richblack-800 p-6 text-richblack-5"
            >
                <p className="text-xl font-semibold">{modalData.text1}</p>
                <p className="mt-2 text-richblack-300">{modalData.text2}</p>

                <div className="mt-6 flex justify-end gap-4">
                    <button
                        onClick={modalData.btn2Handler}
                        className="rounded-full border border-richblack-600 bg-transparent px-5 py-2 text-sm text-richblack-100 transition duration-200 hover:bg-richblack-700 hover:text-white"
                    >
                        {modalData.btn2Text}
                    </button>
                    <button
                        onClick={modalData.btn1Handler}
                        className="rounded-full bg-yellow-400 px-5 py-2 text-sm font-semibold text-black shadow-md transition duration-200 hover:bg-yellow-300"
                    >
                        {modalData.btn1Text}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmationModal;
