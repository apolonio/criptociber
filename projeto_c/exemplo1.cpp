#include <iostream>
#include <string>

using namespace std;

class Person
{
public:
  string name;
  string nickname;
  string lastname;
  string title;
  int    age;
};

void print(Person* person)
{
  cout << person->title << ' ' << person->name <<
          " '" << person->nickname << "' "
          << person->lastname << ", " <<
          person->age << " years old" << endl;
}


int main()
{
  Person person;
  person.name     = "Apolonio";
  person.nickname = "Santiago";
  person.lastname = "Junior";
  person.title    = "M.D.";
  person.age      = 43;

  cout << "Senhor " << person.nickname << endl;
  print(&person);

  return 0;
}