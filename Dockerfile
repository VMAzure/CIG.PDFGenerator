FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["CIG/CIG.csproj", "CIG/"]
RUN dotnet restore "CIG/CIG.csproj"
COPY . .
WORKDIR "/src/CIG"
RUN dotnet build "CIG.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "CIG.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "CIG.dll"]
