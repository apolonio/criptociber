#ifndef QUADRADO_H
#define QUADRADO_H

class Quadrado
{
public:
    Quadrado(double side);
    void set_side(double side);
    double get_area();

private:
    double side;
};

#endif
