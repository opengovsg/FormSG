import { forwardRef, memo, Ref, SVGProps } from 'react'

export const AuthImageSvgr = memo(
  forwardRef((props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
    <svg
      width={117}
      height={144}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      ref={ref}
      {...props}
    >
      <path
        d="M113.401.402h-.25v143.196h3.515V.402h-3.265Z"
        fill="#293044"
        stroke="#293044"
        strokeWidth={0.5}
      />
      <path
        d="M.583.402h-.25v143.196H113.382V.402H.583Z"
        fill="#fff"
        stroke="#293044"
        strokeWidth={0.5}
      />
      <path d="M.583 14.88h112.758v41.974H.583V14.881Z" fill="#4A61C0" />
      <path
        d="M17.53 29.138h78.838v1.14H17.53v-1.14ZM17.53 35.322h78.838v1.14H17.53v-1.14ZM33.294 41.513h47.793v1.14H33.294v-1.14Z"
        fill="#8998D6"
      />
      <rect x={19.583} y={83.652} width={76} height={8} rx={4} fill="#E4E7F6" />
      <rect x={19.583} y={99.652} width={76} height={8} rx={4} fill="#E4E7F6" />
      <rect
        x={19.583}
        y={115.652}
        width={76}
        height={8}
        rx={4}
        fill="#E4E7F6"
      />
      <rect
        x={42.374}
        y={47.875}
        width={19.821}
        height={19.821}
        rx={2.625}
        fill="#293044"
        stroke="#293044"
        strokeWidth={0.75}
      />
      <rect
        x={40.499}
        y={46}
        width={20.571}
        height={20.571}
        rx={3}
        fill="url(#a)"
      />
      <rect
        x={55.874}
        y={61.375}
        width={19.821}
        height={19.821}
        rx={2.625}
        fill="#293044"
        stroke="#293044"
        strokeWidth={0.75}
      />
      <rect
        x={53.999}
        y={59.5}
        width={20.571}
        height={20.571}
        rx={3}
        fill="url(#b)"
      />
      <defs>
        <pattern
          id="a"
          patternContentUnits="objectBoundingBox"
          width={1}
          height={1}
        >
          <use
            xlinkHref="#c"
            transform="matrix(.00714 0 0 .00714 -.079 -.079)"
          />
        </pattern>
        <pattern
          id="b"
          patternContentUnits="objectBoundingBox"
          width={1}
          height={1}
        >
          <use xlinkHref="#d" transform="matrix(.00515 0 0 .00515 -.08 -.08)" />
        </pattern>
        <image
          id="c"
          width={162}
          height={162}
          xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKIAAACiCAYAAADC8hYbAAALIElEQVR4Ae2dv4skxxXH+3/acNhNlmGCTSSMAyUHTiScXHIIwwUCg3FyDg6DkwtOwYHBGGNwoECgwGBwIFBgDEKBUCYEdiDB7k17527LfGu2dntqurqru6u6r7c/BUtP9/aP6lefeq9+vH5VmInTzW5nbn78ydx8+515849/muuXr0z57Pnx35On5vWjD83Vxc/M5ckpfw0ykIy2v/ilKZ88PZbjs+dWxpK1ZG5lv9tNTIExxWg52JYHsL1+/DEwNcA0RWVTmUgROEjNthwNj6wg3vznv2b317+Zq/c/ALp3DLpY0F///JHZffa51Zw5qcwC4tt//duahtiX5bx5NDVk7lW2OVI6ELelrTmX5xdov5lqv2iFcH6x15IJ25ZJQHzz5VfmavMeAD50AL33U5mr7FOkYSBuS9uTja5J3otw3TxMcls5aTRjaMemN4hvv/7GXK7WaEEq156B1dqIib6pF4jXf3gBgABYy4DY6JM6g1h+8pvaDLSpb/7/MMxwTDluf/3bzixGg6gZEI3Ux2SEc5YDXaisxYqYiU3RIAIhcIWgCx0XM7EpCkTMMRCGYGs7HmumW0G8fvEp5piOySAGNH/dlhpBtEM0FMKgQmjTGEv5f9vQThjEbck4IZUwXSVcrRsHvYMgaoJ7KbWV9xynDdzUeakFUR4WFM44hbM0OYe8d2pBxIEBCHNVELFVl45AlBNkrkxwXwAXA2LMT0cg4sgALNkVhjouXjoAkbYhEGaH8HYkwm8rHoAov7KxMsJzlg299WGsaMU7EG++/wEIGTcclQEx59IdiHRSlq2hprBQb774u+Pw/rtmBrABcWwY9R21S1Yjym9s7EzwPMAXA85ncQ8i7UMq4kTtY9dOtCDKVqOh0FBTMODaiRZEOS9OkQmeCfzOcdaCSIQtgJhKKYg9JQviVJnguVQAMbAHUQ6wEzVUeS4gWhC3pSmYUQGGqRWCGCz4LgUQpwZRDBaKDjp1Rnj+siuDGCwU0RUQlg3C1OUvP4di98c/AyKdtUkZEIMFkb3QhlNrRDFYMKsCiFODKAYLlpnoAOJqbSOiqV2tnp6bsL9bJ+bLr4xqN57uHWR6cmrKX31iCvwQI4R2trHrj3QJz6vFdKjkEbI9ObUrUABiS0dFMEnj9U12eOxsM2lnYGrT2/Z8KcNCC7q0nbjU/6vt4hw3+4Ko66QdCVoQ1o5isMDzpl5AarekTHYqFc1Yq/TEICDWmGZ1NlJoQh9kvhuvr/QWxEtq6VEt1RqCudL/fvf7o+cttenj3nsPYo1GcCcscdt3eYZYcNXxofJ7mvFsY4olwtb0zkN6yLEwMpvlgXhyCohVKLcfPY5ladB5tBUBsbF9psn3sRLm+RBGTHOljZxqpc0YmKV9q9p46b8BsQJiW+T7GMBiz2HtGjRiUBM5J4ZYmIacR4cFEMMgfvvdELY6Xct4IiAGQZSDwlhJU4hLbxdW3582YqWNKD/DsRI+i2jEoCZK7egQgtrOrlQqQFUzLPU3GrEKxNkmxE7S40TnPdSGqnyAWAXx5NSM0U7EcxsQg2bZmUQ5aeZwAXMqVYPm7lls74FEI3oaUXBc/+kvjpvkWzzi7+GrVkRArAFRAvIXpElBpFbnrAqf3/dQAmIAxMvzC/utSQoAdQ9mUu6hq6uAgBgCUcfPNmaoI4TamwxeN0MoMAGxCcTb/1mv7W3ZWTnKvDNw3Q4hIEZAeGdGzi/M9YtP2831tjSKlE97MA5AJ180YhcYb8/Vxz4aC9R3z9KWcmCQ+SVqRjf4HIRoxB4QVoXH7/7g+bJDIwLjOzGkBIiACIi+emY/nambmyzRiC0aUU4Q6gWrU+I6JOqs1Bb0am00hacPo2xH5uUrO0PD9yntFQwQW0BMEX5Ewz614LY8e0nXAGILDJ1HsWsuwP8QjThIE129/0ENVt0PEdkBEAeBqEHrFEnmfUlmts+7YpobTHP57HkKDu09+hTOkq4BxAYQr1++SgaizPySwOr6roDYAKKGbVIlvlNpbicCYgOIKWPhyMx31RJLOh8QG0BMGbRTZn5JYHV9V0AMgbhap7LK9j4y810LZ0nnA2IARE3VpUwy80sCq+u7AmIARHlYp0yEGaGz0ksTyes6dbpcrXvlpat2meP5aMSARswRT5uP68NaERADIOaIgcMHVYDY2SRqIcfUiSixgNgZxC5rM8cCK3M/x/bbGHnGNNeZ5vOLWLY6ncdYIhqxkyZSdIYcSeZ+DO0yx2egEWs0YrYQxtsSEGvkrYoDiDWCsbFucqhEY4yijM1RY+XOMyDWgZgzUOejDwGxRuaAWCOUHGOITsESoq6+wwKINSDmGEN0IMrs5zZzc7w/INaBuNs5bpJvFZ97jqDkzjMgeiAqikPOJLOfu1DneH9A9EBUjMOcibFE2ohRmkhxanImxdSeo8bKnWc0oqcRFacmd7ravAeMntwB0ROI4tTkToQ4PjbPgOiBOHQ5ixiICVMHiK0m8eb7H2JYGnQOYeoAsRXEQYRFXqwFynM3/ud2f0xzxTSnCkPXxiMrlKIRGzWRQg6PkWT+56axcucXjVjRiIp7PVbKXbBzuz8gVkBMGYauDehgQPhKfuYG05D8AmKl4McYQ3SAqhkwpOAe2rWAWAExx2LhDjx/q2bAQ4NpyPsAYgXElGHofPD8fcLUHfacAdGBmDgMnQ+ev8+SF4BYaxJTh6HzwfP3WfKiAuLZxhSXZ5vaghli7+d4baqlLHzgQvsseXEPokYQCoYR9gJJuZRFCD7/+BwrbI48A6JrH56cmhxh6Hzw/H38EvdKwIJIzL69MFIuZeEDF9pH9nvZSw4FTpp7YeT8hDQEIoPae9mLwQJh3IL4408hXrId52P7WxA/emwKhLEXRo5GOPeMk60YLJhqihMWUOWTkxgsCIGRT8DAGydbMVgw5xknLKDKJycNnRXMeeYTMPDGyVYMFnw/EScsoMonJzFYEIsln4CBN062YrBg8j1OWECVT05isNB6Igg5n5CRbbtsxWChaQOE1S4sZJRPRmLQgsjkez4hA3CzbF08Sgsig9rNwgKmfPIRe3cakXC6+QQNxM2ydSs4WI1ICIxmYQFTPvm46Gt7EAmnS4et4q0+ZsVTKOc706wfOMjmq/VjFuycnuU6KgcgMucMiGNDLOZcsqZZO8ywAOLYIFYja9yBKBi1TvHYmeF5y6wA/prYByASfWCZUEyhDPyAVwcgSitertZoxYl6kFMAMckzzy9c0/BuewSivGUnyRyFvxi5K5i9n45A1AlEIMBE51JGYqsu1YJIWxEQc4Hotw0dlLUg6p8McANjahirA9gOQLcNgmgdZum4LKbdlhq6o/ut1sZN5zn4qtswiMaYt19/Q0HQiUrCgFhqSo0g6kJ8FTHRR9qtY+WMWTakFUTBSFgSYOwLY+xC7FEgCsbyydMkKrrvC3Hd/CqDmIlN0SCqoclc9PxgmKoCi5WmzokPaDSI7kLMNDC2wR1rjh1T2nYGURex8DUwhmB0H0NVIYv53QtE3dgO7TDOSLvZ9aBXa8tEDHR15/QG0d5sW9JudAWx4K31LdyWdXxFHxsG4u1jFM0JR4nlmWuVuco+RUoCosuIlojAn3EBQK7WJvVyIElBdEDKwwKniYcHpMo05D3jyr7vNguILjP6IEtLi4V6WByfB6wqQ5VlzpQVxIOMb0ujgIwKMaG5Ry3CCIjvFogqE5WNysgugDSwA3JQ/i0744EYyIhG3/VZYRVS1cCjvydPrblnEct2eCUj9WQ1xXYkx2fP7bqDDjYr+9toC4EiGuXw/wEDYnf4Qxd4QQAAAABJRU5ErkJggg=="
        />
        <image
          id="d"
          width={225}
          height={225}
          xlinkHref="data:image/png;base64,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"
        />
      </defs>
    </svg>
  )),
)
