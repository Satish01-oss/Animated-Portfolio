import { forwardRef } from "react";

const Cursor = forwardRef(function Cursor(_, ref) {
  return (
    <div className="cursor" aria-hidden="true" ref={ref}>
      <div className="cursor__dot" />
      <div className="cursor__ring"><span className="cursor__label" /></div>
    </div>
  );
});

export default Cursor;
