
import matplotlib.pyplot as plt
x = [1,2,3,4,5,6]
y = [1,8,1,8,1,8]
plt.plot(x, y)
plt.show()



a = ['A','B','C']
b = [4, 1, 2]
plt.bar(a, b)


a = ['A','B','C']
b = [4, 1, 2]
plt.barh(a, b)


a = [1, 2, 3, 4]
b = [1, 4, 3, 4]
plt.scatter(a, b)




import pandas as pd
df = pd.read_csv('earth-layers.csv')
df #display it


x = df['layer']
y = df['thickness']
plt.bar(x, y)


plt.bar( df['layer'], df['thickness'] )
plt.ylabel('Thickness (km)')
plt.title('Layers of the Earth')