class FadeImage {
    constructor(imagename, x, y, w, h, fade, fadeAmount) {
        this.imagename = imagename;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.fade = fade;
        this.fadeAmount = fadeAmount;
    }

    display() {
        image(this.imagename, this.x, this.y, this.w, this.h);
        push();
        tint(255, this.fade);
        //tint(255, 200);
        filter(INVERT);
        if (this.fade == 0) this.fadeAmount = 1;
        this.fade += this.fadeAmount;
        pop();
    }

    invertImg() {
        filter(INVERT);
    }


}