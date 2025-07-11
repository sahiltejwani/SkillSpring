import React from 'react'

import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import "swiper/css/free-mode"
import "swiper/css/pagination"

import {
  Autoplay,
  FreeMode,
  Navigation,
  Pagination,
  Mousewheel,
  Keyboard
} from 'swiper/modules'

import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import "react-loading-skeleton/dist/skeleton.css";

import Course_Card from './Course_Card'

const CourseSlider = ({ Courses }) => {
  return (
    <>
      {Courses?.length ? (
        <Swiper
          mousewheel={{
            enabled: true,
            forceToAxis: true,
          }}
          keyboard={{
            enabled: true,
            onlyInViewport: true,
          }}
          allowSlidePrev={true}
          slidesPerView={1}
          loop={false}
          spaceBetween={20}
          pagination={{ clickable: true }}
          modules={[Pagination, Navigation, FreeMode, Mousewheel, Keyboard]}
          className="mySwiper md:pt-5"
          freeMode={true}
          navigation={true}
          breakpoints={{
            300: { slidesPerView: 2.1, spaceBetween: 10 },
            640: { slidesPerView: 2.2 },
            1024: { slidesPerView: 3.1 },
          }}
          style={{
            "--swiper-navigation-size": "20px",
          }}
        >
          {Courses.map((course, index) => (
            <SwiperSlide key={index}>
              <Course_Card course={course} Height={"lg:h-[250px] h-[100px]"} />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className='flex flex-col items-center justify-center w-full py-10'>
          <p className='text-richblack-100 text-lg'>Not Found Anything</p>
        </div>
      )}
    </>
  )
}

export default CourseSlider
