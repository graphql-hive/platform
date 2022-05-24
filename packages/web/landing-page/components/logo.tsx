import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      className={className}
      width="139"
      height="61"
      viewBox="0 0 139 61"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.29999 20.1C0.899988 19.3 0 17.8 0 16.1C0 13.6 2.10004 11.5 4.60004 11.5C5.30004 11.5 5.90002 11.6 6.40002 11.9L25.7 0.800049C26.6 0.300049 27.7 0 28.7 0C29.8 0 30.8 0.300049 31.7 0.800049L48.1 10.3C46.9 11.1 46 12.3 45.4 13.7L29.5 4.5C29.2 4.3 28.9 4.30005 28.6 4.30005C28.3 4.30005 28 4.4 27.7 4.5L8.90002 15.3C8.90002 15.6 9 15.8 9 16.1C9 18.1 7.7 19.7 6 20.4C5.9 20.4 5.70004 20.5 5.60004 20.5H5.5C5.4 20.5 5.20004 20.6 5.10004 20.6H5C4.8 20.6 4.7 20.6 4.5 20.6C4.3 20.6 4.10002 20.6 3.90002 20.6H3.79999C3.69999 20.6 3.50002 20.6 3.40002 20.5H3.29999C2.99999 20.4 2.59999 20.3 2.29999 20.1ZM56.7 16.1C56.7 17.5 56.1 18.7 55.1 19.5V41.2C55.1 43.4 53.9 45.4 52.1 46.5L35.7 55.9C35.7 54.4 35.2 52.9 34.3 51.8L49.9 42.8C50.5 42.5 50.8 41.9 50.8 41.2V20.5C48.9 19.9 47.5 18.2 47.5 16.1C47.5 15.1 47.8 14.2 48.4 13.4C48.5 13.3 48.6 13.1 48.7 13C49 12.7 49.2 12.5 49.5 12.3C49.5 12.3 49.6 12.3 49.6 12.2C49.7 12.1 49.8 12.1 50 12C50 12 50.1 12 50.1 11.9C50.3 11.8 50.4 11.8 50.6 11.7C51 11.6 51.5 11.5 52 11.5C54.6 11.5 56.7 13.6 56.7 16.1ZM33.3 56.1C33.3 56.3 33.3 56.6 33.2 56.8V56.9C32.8 59 31 60.7 28.7 60.7C26.7 60.7 25 59.4 24.4 57.6L5.40002 46.6C3.50002 45.5 2.40002 43.5 2.40002 41.3V22.8C3.10002 23 3.90004 23.2 4.60004 23.2C5.30004 23.2 6.00004 23.1 6.60004 22.9V41.3C6.60004 42 7 42.6 7.5 42.9L25.3 53.2C26.1 52.2 27.4 51.6 28.8 51.6C30.3 51.6 31.6 52.3 32.5 53.5C32.5 53.5 32.5 53.5 32.5 53.6C32.6 53.7 32.6 53.8 32.7 53.9C32.7 53.9 32.7 54 32.8 54C32.8 54.1 32.9 54.2 32.9 54.2C32.9 54.2 32.9 54.3 33 54.3C33 54.4 33.1 54.5 33.1 54.5C33.1 54.6 33.1 54.6 33.2 54.7C33.2 54.7999 33.3 54.8 33.3 54.9C33.3 55 33.3 55 33.4 55.1C33.4 55.2 33.4 55.2001 33.4 55.3C33.4 55.4 33.4 55.5 33.4 55.6C33.4 55.7 33.4 55.7001 33.4 55.8C33.3 55.8 33.3 55.9 33.3 56.1Z"
        fill="#eab308"
      />
      <path
        d="M41.345 29.2535L43.8319 24.9475C44.056 24.5594 44.056 24.0813 43.8319 23.6933L40.9828 18.7602C40.7587 18.3721 40.3446 18.1331 39.8963 18.1331H34.9225L32.4356 13.827C32.2115 13.439 31.7973 13.2 31.3491 13.2H25.6509C25.2027 13.2 24.7885 13.439 24.5644 13.827L22.0775 18.1331H17.1037C16.6554 18.1331 16.2413 18.3721 16.0172 18.7602L13.1681 23.6933C12.944 24.0814 12.944 24.5595 13.1681 24.9475L15.655 29.2535L13.1681 33.5596C12.944 33.9476 12.944 34.4257 13.1681 34.8138L16.0172 39.7469C16.2413 40.135 16.6554 40.374 17.1037 40.374H22.0775L24.5644 44.68C24.7885 45.068 25.2027 45.3071 25.6509 45.3071H31.3491C31.7973 45.3071 32.2115 45.068 32.4356 44.68L34.9225 40.3739H39.8963C40.3446 40.3739 40.7587 40.1349 40.9828 39.7469L43.8319 34.8137C44.056 34.4257 44.056 33.9476 43.8319 33.5595L41.345 29.2535ZM22.0775 37.8656H17.828L15.7033 34.1866L17.828 30.5077H22.0775L24.2023 34.1866C23.9443 34.6334 22.3364 37.4173 22.0775 37.8656ZM22.0775 27.9993H17.828L15.7033 24.3204L17.828 20.6414H22.0775C22.3355 21.0881 23.9433 23.8721 24.2023 24.3204L22.0775 27.9993ZM30.6248 42.7987H26.3753L24.2505 39.1198C24.5085 38.6731 26.1163 35.8892 26.3753 35.4409H30.6248C30.8828 35.8876 32.4906 38.6715 32.7496 39.1198L30.6248 42.7987ZM24.2505 29.2535L26.3752 25.5746H30.6248L32.7495 29.2535L30.6248 32.9325H26.3752L24.2505 29.2535ZM30.6248 23.0662H26.3753C26.1173 22.6194 24.5095 19.8355 24.2505 19.3872L26.3752 15.7083H30.6247L32.7495 19.3872C32.4915 19.834 30.8837 22.6179 30.6248 23.0662ZM39.172 37.8656H34.9225C34.6645 37.4188 33.0567 34.6349 32.7977 34.1866L34.9225 30.5077H39.172L41.2967 34.1867L39.172 37.8656ZM39.172 27.9993H34.9225L32.7977 24.3204C33.0557 23.8737 34.6635 21.0898 34.9225 20.6415H39.172L41.2967 24.3204L39.172 27.9993Z"
        fill="#FFB21D"
      />
      <path
        d="M78.074 14.3199V20.9859H71.078V14.3199H66.7V31.4799H71.078V25.0999H78.074V31.4799H82.474V14.3199H78.074Z"
        fill="#0B0D11"
      />
      <path d="M90.1824 14.3199V31.4799H94.5824V14.3199H90.1824Z" fill="#0B0D11" />
      <path
        d="M112.244 31.4799L119.196 14.3199H114.4L110.066 25.8479L105.754 14.3199H100.958L107.888 31.4799H112.244Z"
        fill="#0B0D11"
      />
      <path
        d="M125.567 31.4799H138.745V27.2339H129.967V25.0339H137.183V21.0519H129.967V18.5879H138.745V14.3199H125.567V31.4799Z"
        fill="#0B0D11"
      />
      <path
        d="M70.7 39.88H74.4V44.38H72.7999V43.6801C72.3999 44.2801 71.5999 44.5801 70.7999 44.5801C68.5999 44.5801 66.7 42.7801 66.7 40.5801C66.7 38.3801 68.5999 36.5801 70.7999 36.5801C72.0999 36.5801 73.3 37.1801 74.1 38.1801L72.4999 39.28C72.0999 38.78 71.4999 38.48 70.7999 38.48C69.5999 38.48 68.7 39.3801 68.7 40.5801C68.7 41.7801 69.5999 42.6801 70.7999 42.6801C71.4999 42.6801 72.0999 42.38 72.4999 41.78V41.5801H70.7V39.88Z"
        fill="#C4C4C4"
      />
      <path
        d="M80.1 36.6801C82.1 36.6801 82.9999 37.98 82.9999 39.48C82.9999 40.58 82.4999 41.5801 81.4999 42.0801L83.2 44.38H80.7999L79.2999 42.28H78.2999V44.38H76.2999V36.6801H80.1ZM78.2999 38.48V40.5801H79.9999C80.7999 40.5801 81.1 40.0801 81.1 39.5801C81.1 38.9801 80.7999 38.5801 79.9999 38.5801H78.2999V38.48Z"
        fill="#C4C4C4"
      />
      <path
        d="M89.2999 36.6801L92.4 44.38H90.2L89.7999 43.28H86.7999L86.4 44.38H84.2L87.2999 36.6801H89.2999ZM88.2999 39.1801L87.4 41.48H89.1L88.2999 39.1801Z"
        fill="#C4C4C4"
      />
      <path
        d="M93.8999 36.6801H97.2999C99.3999 36.6801 100.3 38.0801 100.3 39.6801C100.3 41.2801 99.2999 42.6801 97.2999 42.6801H95.8999V44.48H93.8999V36.6801ZM95.8999 38.48V40.88H97.1999C97.9999 40.88 98.2999 40.3801 98.2999 39.6801C98.2999 39.0801 97.9999 38.48 97.1999 38.48H95.8999Z"
        fill="#C4C4C4"
      />
      <path
        d="M109.2 36.6801V44.38H107.2V41.48H104V44.38H102V36.6801H104V39.6801H107.2V36.6801H109.2Z"
        fill="#C4C4C4"
      />
      <path
        d="M115 36.48C117.3 36.48 119.1 38.28 119.1 40.48C119.1 41.98 118.3 43.18 117.1 43.98C117.5 44.18 117.8 44.38 118.1 44.38C118.2 44.38 118.6 44.3801 118.8 44.0801L120.3 45.28C119.7 46.08 118.8 46.38 118.1 46.38C116.5 46.38 115.6 44.9801 114.3 44.5801C112.4 44.2801 110.9 42.5801 110.9 40.5801C110.9 38.2801 112.7 36.48 115 36.48ZM115 42.5801C116.2 42.5801 117.1 41.68 117.1 40.48C117.1 39.28 116.2 38.38 115 38.38C113.8 38.38 112.9 39.28 112.9 40.48C112.9 41.68 113.8 42.5801 115 42.5801Z"
        fill="#C4C4C4"
      />
      <path d="M120.8 36.6801H122.8V42.48H126.5V44.38H120.8V36.6801Z" fill="#C4C4C4" />
    </svg>
  );

  // return (
  //   <svg
  //     className={className}
  //     width="70"
  //     height="32"
  //     viewBox="0 0 70 32"
  //     fill="none"
  //     xmlns="http://www.w3.org/2000/svg"
  //   >
  //     <path
  //       d="M12.8116 12.8333V20.2075H4.93136V12.8333H0V31.8164H4.93136V24.7586H12.8116V31.8164H17.7677V12.8333H12.8116Z"
  //       fill="#eab308"
  //     />
  //     <path
  //       d="M22.7334 12.8333V31.8164H27.6895V12.8333H22.7334Z"
  //       fill="#eab308"
  //     />
  //     <path
  //       d="M43.8665 31.8164L51.6971 12.8333H46.295L41.4132 25.586L36.5562 12.8333H31.154L38.9599 31.8164H43.8665Z"
  //       fill="#eab308"
  //     />
  //     <path
  //       d="M55.1564 31.8164H70V27.1193H60.1125V24.6856H68.2406V20.2805H60.1125V17.5547H70V12.8333H55.1564V31.8164Z"
  //       fill="#eab308"
  //     />
  //     <path
  //       d="M4.57333 5.90333H6.77833V6.16C6.34667 6.79 5.64667 7.19833 4.83 7.19833C3.45333 7.19833 2.35667 6.10167 2.35667 4.725C2.35667 3.34833 3.45333 2.25167 4.83 2.25167C5.62333 2.25167 6.32333 2.61333 6.77833 3.185L8.68 1.90167C7.805 0.758334 6.39333 0 4.83 0C2.19333 0 0 2.12333 0 4.725C0 7.32667 2.19333 9.45 4.83 9.45C5.76333 9.45 6.685 9.1 7.12833 8.42333V9.275H8.96V3.96667H4.57333V5.90333Z"
  //       fill="#000"
  //     />
  //     <path
  //       d="M11.0661 0.175V9.275H13.3878V6.83667H14.5778L16.3044 9.275H19.0928L17.1211 6.52167C18.3461 5.96167 18.9178 4.77167 18.9178 3.5C18.9178 1.69167 17.8444 0.175 15.5111 0.175H11.0661ZM15.3828 2.29833C16.3161 2.29833 16.6661 2.82333 16.6661 3.52333C16.6661 4.15333 16.3161 4.725 15.3828 4.725H13.3878V2.29833H15.3828Z"
  //       fill="#000"
  //     />
  //     <path
  //       d="M23.753 0.175L20.0663 9.275H22.6096L23.1113 7.945H26.693L27.1946 9.275H29.738L26.063 0.175H23.753ZM25.8996 5.83333H23.9046L24.908 3.16167L25.8996 5.83333Z"
  //       fill="#000"
  //     />
  //     <path
  //       d="M31.3666 9.275H33.6999V7.21H35.3799C37.7949 7.21 38.9499 5.58833 38.9499 3.66333C38.9499 1.83167 37.7949 0.175 35.3799 0.175H31.3666V9.275ZM35.2516 2.29833C36.2316 2.29833 36.5932 2.95167 36.5932 3.675C36.5932 4.48 36.2316 5.08667 35.2516 5.08667H33.6999V2.29833H35.2516Z"
  //       fill="#000"
  //     />
  //     <path
  //       d="M46.8136 0.175V3.71H43.1036V0.175H40.7819V9.275H43.1036V5.89167H46.8136V9.275H49.1469V0.175H46.8136Z"
  //       fill="#000"
  //     />
  //     <path
  //       d="M51.0531 4.725C51.0531 7.05833 52.8264 9.01833 55.0897 9.38C56.6647 9.905 57.7264 11.5383 59.5581 11.5383C60.3864 11.5383 61.4481 11.2 62.1014 10.3017L60.3397 8.87833C60.0947 9.25167 59.6747 9.28667 59.5464 9.28667C59.1497 9.28667 58.7764 9.07667 58.3564 8.785C59.7681 7.95667 60.7131 6.45167 60.7131 4.725C60.7131 2.12333 58.5431 0 55.8831 0C53.2581 0 51.0531 2.12333 51.0531 4.725ZM53.4097 4.725C53.4097 3.34833 54.5181 2.25167 55.8831 2.25167C57.2831 2.25167 58.3564 3.34833 58.3564 4.725C58.3564 6.10167 57.2831 7.19833 55.8831 7.19833C54.5181 7.19833 53.4097 6.10167 53.4097 4.725Z"
  //       fill="#000"
  //     />
  //     <path
  //       d="M62.6319 9.275H69.3169V7.02333H64.9535V0.175H62.6319V9.275Z"
  //       fill="#000"
  //     />
  //   </svg>
  // );
};
