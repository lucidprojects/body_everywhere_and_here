class RouteBlock {
    constructor(x, y, w, h, angle) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.angle = angle;
    }

    display() {
        // rectMode(CENTER);
        angleMode(DEGREES);
        noStroke();
        push();
        translate(this.x, this.y); // this ia actually where it goes top,left point since translated to
        // translate(0, 0);
        rotate(0);
        rotate(this.angle);
        // fill(this.color);
        fill(255,0,0,100);
        rect(0,0, this.w, this.h);
        pop();
    }


}