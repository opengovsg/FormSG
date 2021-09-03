import { chakra } from '@chakra-ui/react'

export const OtpIcon = chakra(
  (props: React.SVGProps<SVGSVGElement>): JSX.Element => {
    return (
      <svg
        width={112}
        height={172}
        viewBox="0 0 112 172"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M88.078 15.698c0-8.289-7.137-15.011-15.94-15.011H15.94C7.138.687 0 7.409 0 15.698v140.108c0 8.29 7.137 15.011 15.94 15.011h56.198c8.803 0 15.94-6.721 15.94-15.011V15.698zM84.175 147.3H3.903V24.206h80.272V147.3z"
          fill="#445072"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M59.51 14.142c0 .312-.144.564-.323.564H29.314c-.18 0-.323-.252-.323-.564 0-.31.144-.563.323-.563h29.873c.179 0 .323.254.323.563zm-9.27 144.241c0 2.974-2.441 5.386-5.455 5.386-3.013 0-5.456-2.412-5.456-5.386 0-2.975 2.443-5.386 5.456-5.386 3.014 0 5.456 2.411 5.456 5.386z"
          fill="#B7C0E6"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M100.74 41.65H39.292c-6.026 0-10.911 4.823-10.911 10.772v50.458l9.767-7.713c.375.038.757.06 1.144.06h61.448c6.026 0 10.91-4.823 10.91-10.772V52.422c0-5.95-4.884-10.772-10.91-10.772z"
          fill="#05CC9A"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M66.507 79.55l19.566-19.315-2.767-2.731-18.182 17.95-8.4-8.292-2.765 2.73 9.782 9.659a1.967 1.967 0 002.766 0z"
          fill="#fff"
        />
      </svg>
    )
  },
)
