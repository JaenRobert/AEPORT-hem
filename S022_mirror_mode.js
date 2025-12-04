AESI.mirror = {
    active: false,
    toggle(){
        this.active = !this.active;
        AESI.display.send("mirror", {active:this.active});
    }
};
