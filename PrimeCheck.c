#include <stdio.h>

int main() 

{
    int n, r;
    printf("Enter a number: ");
    scanf("%d", &n);

    r = 0;

    if (n <= 1)
     printf("%d is not a prime number.", n);
    else {
        for (int i = 2; i <= n / 2; i++) {
            if (n % i == 0) {
                r = 1;
                break;
            }
        }

    if (r == 1) 
        printf("%d is not a prime number.", n);
            
    else
        printf("%d is a prime number.", n);
    }
    return 0;
}